import { NextResponse } from "next/server";
import {
  MaintenanceAuditEventType,
  MaintenancePaymentMethod,
  MaintenanceReceiver,
  MaintenanceServiceType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SummaryValues = {
  count: number;
  totalRevenue: number;
  firstPersonTotal: number;
  secondPersonTotal: number;
};

type SummaryItem = {
  maintenanceType: MaintenanceServiceType;
  paymentMethod: MaintenancePaymentMethod | null;
  receivedBy: MaintenanceReceiver | null;
  appliedPrice: number;
  firstPersonAmount: number;
  secondPersonAmount: number;
};

type OrphanSettlementId = {
  id: number;
};

async function removeDeletedTaskSettlements() {
  const orphanIds = await prisma.$queryRaw<OrphanSettlementId[]>`
    SELECT settlement."id"
    FROM "MaintenanceSettlementItem" settlement
    LEFT JOIN "Task" task
      ON task."id" = settlement."taskId"
    WHERE task."id" IS NULL
  `;

  if (orphanIds.length === 0) {
    return 0;
  }

  const ids = orphanIds.map((item) => item.id);

  const orphanItems =
    await prisma.maintenanceSettlementItem.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

  await prisma.$transaction(async (transaction) => {
    for (const item of orphanItems) {
      await transaction.maintenanceAuditLog.create({
        data: {
          eventType:
            MaintenanceAuditEventType.SETTLEMENT_ITEM_VOIDED,
          entityType: "MaintenanceSettlementItem",
          entityId: item.id,
          description:
            "Törölt munkához tartozó elszámolási tétel automatikusan eltávolítva.",
          details: {
            correctionType: "ORPHAN_SETTLEMENT_CLEANUP",
            reason: "A kapcsolódó Task rekord már nem létezik.",
            settlementItem: {
              id: item.id,
              taskId: item.taskId,
              machineIndex: item.machineIndex,
              clientName: item.clientName,
              machineName: item.machineName,
              maintenanceType: item.maintenanceType,
              paymentMethod: item.paymentMethod,
              receivedBy: item.receivedBy,
              appliedPrice: item.appliedPrice,
              firstPersonAmount: item.firstPersonAmount,
              secondPersonAmount: item.secondPersonAmount,
              completedAt: item.completedAt.toISOString(),
              periodId: item.periodId,
              priceId: item.priceId,
              createdAt: item.createdAt.toISOString(),
            },
          },
        },
      });
    }

    await transaction.maintenanceSettlementItem.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  });

  return orphanItems.length;
}

function createEmptySummary(): SummaryValues {
  return {
    count: 0,
    totalRevenue: 0,
    firstPersonTotal: 0,
    secondPersonTotal: 0,
  };
}

function calculateSummary(items: SummaryItem[]) {
  const wash = createEmptySummary();
  const disinfection = createEmptySummary();

  let cashReceivedByFirstPerson = 0;
  let transferReceivedBySecondPerson = 0;
  let missingPaymentMethodCount = 0;
  let missingPaymentMethodAmount = 0;

  for (const item of items) {
    const target =
      item.maintenanceType === MaintenanceServiceType.WASH
        ? wash
        : disinfection;

    target.count += 1;
    target.totalRevenue += item.appliedPrice;
    target.firstPersonTotal += item.firstPersonAmount;
    target.secondPersonTotal += item.secondPersonAmount;

    if (
      item.paymentMethod === MaintenancePaymentMethod.CASH &&
      item.receivedBy === MaintenanceReceiver.FIRST_PERSON
    ) {
      cashReceivedByFirstPerson += item.appliedPrice;
    }

    if (
      item.paymentMethod === MaintenancePaymentMethod.TRANSFER &&
      item.receivedBy === MaintenanceReceiver.SECOND_PERSON
    ) {
      transferReceivedBySecondPerson += item.appliedPrice;
    }

    if (!item.paymentMethod || !item.receivedBy) {
      missingPaymentMethodCount += 1;
      missingPaymentMethodAmount += item.appliedPrice;
    }
  }

  const total = {
    count: wash.count + disinfection.count,
    totalRevenue: wash.totalRevenue + disinfection.totalRevenue,
    firstPersonTotal:
      wash.firstPersonTotal + disinfection.firstPersonTotal,
    secondPersonTotal:
      wash.secondPersonTotal + disinfection.secondPersonTotal,
  };

  const receivedTotal =
    cashReceivedByFirstPerson + transferReceivedBySecondPerson;

  const firstPersonBalance =
    cashReceivedByFirstPerson - total.firstPersonTotal;

  const secondPersonBalance =
    transferReceivedBySecondPerson - total.secondPersonTotal;

  let settlementDirection:
    | "FIRST_PAYS_SECOND"
    | "SECOND_PAYS_FIRST"
    | "SETTLED"
    | "INCOMPLETE" = "SETTLED";

  let settlementAmount = 0;

  if (missingPaymentMethodCount > 0) {
    settlementDirection = "INCOMPLETE";
  } else if (firstPersonBalance > 0) {
    settlementDirection = "FIRST_PAYS_SECOND";
    settlementAmount = firstPersonBalance;
  } else if (firstPersonBalance < 0) {
    settlementDirection = "SECOND_PAYS_FIRST";
    settlementAmount = Math.abs(firstPersonBalance);
  }

  return {
    wash,
    disinfection,
    total,
    received: {
      firstPerson: cashReceivedByFirstPerson,
      secondPerson: transferReceivedBySecondPerson,
      total: receivedTotal,
    },
    balances: {
      firstPerson: firstPersonBalance,
      secondPerson: secondPersonBalance,
    },
    settlement: {
      direction: settlementDirection,
      amount: settlementAmount,
    },
    paymentValidation: {
      missingPaymentMethodCount,
      missingPaymentMethodAmount,
      isComplete: missingPaymentMethodCount === 0,
    },
  };
}

export async function GET() {
  try {
    /*
     * Védelmi takarítás: ha egy Task már nem létezik,
     * a hozzá tartozó elszámolási tétel nem számíthat bele.
     */
    const removedOrphanItems =
      await removeDeletedTaskSettlements();

    if (removedOrphanItems > 0) {
      console.log(
        `${removedOrphanItems} törölt munkához tartozó elszámolási tétel eltávolítva.`
      );
    }

    let activePeriod =
      await prisma.maintenanceSettlementPeriod.findFirst({
        where: {
          endedAt: null,
        },
        orderBy: [
          {
            startedAt: "desc",
          },
          {
            id: "desc",
          },
        ],
      });

    if (!activePeriod) {
      activePeriod =
        await prisma.maintenanceSettlementPeriod.create({
          data: {
            startedAt: new Date(),
          },
        });
    }

    const activeItems =
      await prisma.maintenanceSettlementItem.findMany({
        where: {
          periodId: activePeriod.id,
        },
        orderBy: [
          {
            completedAt: "desc",
          },
          {
            id: "desc",
          },
        ],
        include: {
          price: true,
        },
      });

    const activeSummary = calculateSummary(activeItems);

    const allPrices = await prisma.maintenancePrice.findMany({
      orderBy: [
        {
          validFrom: "desc",
        },
        {
          id: "desc",
        },
      ],
    });

    const currentWashPrice =
      allPrices.find(
        (price) =>
          price.maintenanceType === MaintenanceServiceType.WASH
      ) || null;

    const currentDisinfectionPrice =
      allPrices.find(
        (price) =>
          price.maintenanceType ===
          MaintenanceServiceType.DISINFECTION
      ) || null;

    const closedPeriods =
      await prisma.maintenanceSettlementPeriod.findMany({
        where: {
          endedAt: {
            not: null,
          },
        },
        orderBy: {
          endedAt: "desc",
        },
        include: {
          items: {
            orderBy: [
              {
                completedAt: "desc",
              },
              {
                id: "desc",
              },
            ],
          },
        },
      });

    const periodHistory = closedPeriods.map((period) => ({
      id: period.id,
      startedAt: period.startedAt,
      endedAt: period.endedAt,
      createdAt: period.createdAt,
      summary: calculateSummary(period.items),
    }));

    const auditLogs = await prisma.maintenanceAuditLog.findMany({
      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],
    });

    const distributedTotal =
      activeSummary.total.firstPersonTotal +
      activeSummary.total.secondPersonTotal;

    const distributionIsValid =
      distributedTotal === activeSummary.total.totalRevenue;

    return NextResponse.json(
      {
        activePeriod: {
          id: activePeriod.id,
          startedAt: activePeriod.startedAt,
          endedAt: activePeriod.endedAt,
          createdAt: activePeriod.createdAt,
        },
        currentPrices: {
          WASH: currentWashPrice,
          DISINFECTION: currentDisinfectionPrice,
        },
        summary: {
          wash: activeSummary.wash,
          disinfection: activeSummary.disinfection,
          total: activeSummary.total,
          received: activeSummary.received,
          balances: activeSummary.balances,
          settlement: activeSummary.settlement,
          paymentValidation: activeSummary.paymentValidation,
          validation: {
            distributedTotal,
            expectedTotal: activeSummary.total.totalRevenue,
            difference:
              distributedTotal - activeSummary.total.totalRevenue,
            isValid: distributionIsValid,
          },
        },
        items: activeItems,
        previousPeriods: periodHistory,
        auditLogs,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "Karbantartási összesítő lekérési hibája:",
      error
    );

    return NextResponse.json(
      {
        error: "A karbantartási összesítő lekérése nem sikerült.",
        details:
          error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      }
    );
  }
}
