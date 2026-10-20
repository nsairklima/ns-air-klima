import { NextResponse } from "next/server";
import {
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

function createEmptySummary():
  SummaryValues {
  return {
    count: 0,
    totalRevenue: 0,
    firstPersonTotal: 0,
    secondPersonTotal: 0,
  };
}

function calculateSummary(
  items: Array<{
    maintenanceType:
      MaintenanceServiceType;

    paymentMethod:
      | "CASH"
      | "TRANSFER"
      | null;

    receivedBy:
      | "FIRST_PERSON"
      | "SECOND_PERSON"
      | null;

    appliedPrice: number;
    firstPersonAmount: number;
    secondPersonAmount: number;
  }>
) {
  const wash =
    createEmptySummary();

  const disinfection =
    createEmptySummary();

  let cashReceivedByFirstPerson = 0;

  let transferReceivedBySecondPerson = 0;

  let missingPaymentMethodCount = 0;

  let missingPaymentMethodAmount = 0;

  for (const item of items) {
    /*
     * Mosás vagy Fertőtlenítés
     * összesítésének kiválasztása.
     */
    const target =
      item.maintenanceType ===
      MaintenanceServiceType.WASH
        ? wash
        : disinfection;

    target.count += 1;

    target.totalRevenue +=
      item.appliedPrice;

    target.firstPersonTotal +=
      item.firstPersonAmount;

    target.secondPersonTotal +=
      item.secondPersonAmount;

    /*
     * Készpénz esetén a teljes összeg
     * az 1. főhöz érkezett.
     */
    if (
      item.paymentMethod === "CASH" &&
      item.receivedBy ===
        "FIRST_PERSON"
    ) {
      cashReceivedByFirstPerson +=
        item.appliedPrice;
    }

    /*
     * Átutalás esetén a teljes összeg
     * a 2. főhöz érkezett.
     */
    if (
      item.paymentMethod ===
        "TRANSFER" &&
      item.receivedBy ===
        "SECOND_PERSON"
    ) {
      transferReceivedBySecondPerson +=
        item.appliedPrice;
    }

    /*
     * A régi tételeknél még hiányozhat
     * a fizetési mód vagy a pénz fogadója.
     * Ezeket nem osztjuk be találomra.
     */
    if (
      !item.paymentMethod ||
      !item.receivedBy
    ) {
      missingPaymentMethodCount += 1;

      missingPaymentMethodAmount +=
        item.appliedPrice;
    }
  }

  /*
   * Az időszak teljes darabszáma
   * és teljes bevétele.
   */
  const total = {
    count:
      wash.count +
      disinfection.count,

    totalRevenue:
      wash.totalRevenue +
      disinfection.totalRevenue,

    firstPersonTotal:
      wash.firstPersonTotal +
      disinfection.firstPersonTotal,

    secondPersonTotal:
      wash.secondPersonTotal +
      disinfection.secondPersonTotal,
  };

  /*
   * Mennyinek kellene az 1. főnél lennie
   * a járandósága alapján, és ténylegesen
   * mennyi érkezett hozzá készpénzben.
   */
  const firstPersonBalance =
    cashReceivedByFirstPerson -
    total.firstPersonTotal;

  /*
   * Mennyinek kellene a 2. főnél lennie
   * a járandósága alapján, és ténylegesen
   * mennyi érkezett hozzá utalással.
   */
  const secondPersonBalance =
    transferReceivedBySecondPerson -
    total.secondPersonTotal;

  let settlementDirection:
    | "FIRST_PAYS_SECOND"
    | "SECOND_PAYS_FIRST"
    | "SETTLED"
    | "INCOMPLETE" =
      "SETTLED";

  let settlementAmount = 0;

  /*
   * Ha van olyan régi tétel, amelynél
   * nincs fizetési mód, nem állapítunk
   * meg végleges tartozást.
   */
  if (
    missingPaymentMethodCount > 0
  ) {
    settlementDirection =
      "INCOMPLETE";
  } else if (
    firstPersonBalance > 0
  ) {
    /*
     * Az 1. főnél több pénz van,
     * mint amennyi neki jár.
     */
    settlementDirection =
      "FIRST_PAYS_SECOND";

    settlementAmount =
      firstPersonBalance;
  } else if (
    firstPersonBalance < 0
  ) {
    /*
     * Az 1. főnél kevesebb pénz van,
     * mint amennyi neki jár.
     */
    settlementDirection =
      "SECOND_PAYS_FIRST";

    settlementAmount =
      Math.abs(
        firstPersonBalance
      );
  }

 return {
  wash,
  disinfection,
  total,

  received: {
    firstPerson:
      cashReceivedByFirstPerson,

    secondPerson:
      transferReceivedBySecondPerson,

    total:
      cashReceivedByFirstPerson +
      transferReceivedBySecondPerson,
  },

  balances: {
    firstPerson:
      firstPersonBalance,

    secondPerson:
      secondPersonBalance,
  },

  settlement: {
    direction:
      settlementDirection,

    amount:
      settlementAmount,
  },
};

    /*
     * Pozitív érték:
     * az adott személynél több van,
     * mint amennyi neki jár.
     *
     * Negatív érték:
     * az adott személynek még kapnia kell.
     */
    balances: {
      firstPerson:
        firstPersonBalance,

      secondPerson:
        secondPersonBalance,
    },

    /*
     * Ki fizet kinek, és mennyit.
     */
    settlement: {
      direction:
        settlementDirection,

      amount:
        settlementAmount,
    },

    /*
     * Régi, fizetési mód nélküli
     * elszámolási tételek.
     */
    paymentValidation: {
      missingPaymentMethodCount,

      missingPaymentMethodAmount,

      isComplete:
        missingPaymentMethodCount ===
        0,
    },
  };
}

export async function GET() {
  try {
    /*
     * Megkeressük az aktív időszakot.
     *
     * Aktív az az időszak, amelynek
     * nincs lezárási dátuma.
     */
    let activePeriod =
      await prisma
        .maintenanceSettlementPeriod
        .findFirst({
          where: {
            endedAt: null,
          },

          orderBy: {
            startedAt: "desc",
          },
        });

    /*
     * Ha valamiért még nincs aktív
     * időszak, automatikusan létrehozzuk.
     *
     * Ez nem reset, ezért nem készül
     * PERIOD_RESET naplóbejegyzés.
     */
    if (!activePeriod) {
      activePeriod =
        await prisma
          .maintenanceSettlementPeriod
          .create({
            data: {
              startedAt:
                new Date(),
            },
          });
    }

    /*
     * Lekérjük az aktív időszak összes
     * elszámolási tételét.
     */
    const activeItems =
      await prisma
        .maintenanceSettlementItem
        .findMany({
          where: {
            periodId:
              activePeriod.id,
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

    const activeSummary =
      calculateSummary(activeItems);

    /*
     * Aktuális árak lekérése.
     *
     * Típusonként a legújabb érvényességi
     * dátumú ár lesz az aktuális.
     */
    const allPrices =
      await prisma
        .maintenancePrice
        .findMany({
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
          price.maintenanceType ===
          MaintenanceServiceType.WASH
      ) || null;

    const currentDisinfectionPrice =
      allPrices.find(
        (price) =>
          price.maintenanceType ===
          MaintenanceServiceType
            .DISINFECTION
      ) || null;

    /*
     * Korábbi, már lezárt időszakok.
     */
    const closedPeriods =
      await prisma
        .maintenanceSettlementPeriod
        .findMany({
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
                  completedAt:
                    "desc",
                },
                {
                  id: "desc",
                },
              ],
            },
          },
        });

    /*
     * A lezárt időszakokhoz is
     * kiszámítjuk az összesítést.
     */
    const periodHistory =
      closedPeriods.map(
        (period) => {
          return {
            id: period.id,

            startedAt:
              period.startedAt,

            endedAt:
              period.endedAt,

            createdAt:
              period.createdAt,

            summary:
              calculateSummary(
                period.items
              ),
          };
        }
      );

    /*
     * A legutóbbi naplóbejegyzések.
     *
     * Az összes bejegyzést visszaadjuk,
     * hogy minden korábbi változás
     * visszakereshető legyen.
     */
    const auditLogs =
      await prisma
        .maintenanceAuditLog
        .findMany({
          orderBy: [
            {
              createdAt: "desc",
            },
            {
              id: "desc",
            },
          ],
        });

    /*
     * Biztonsági ellenőrzés:
     *
     * az első és második személy teljes
     * összegének egyeznie kell az összes
     * bevétellel.
     */
    const distributedTotal =
      activeSummary.total
        .firstPersonTotal +
      activeSummary.total
        .secondPersonTotal;

    const distributionIsValid =
      distributedTotal ===
      activeSummary.total
        .totalRevenue;

    return NextResponse.json(
      {
        activePeriod: {
          id: activePeriod.id,

          startedAt:
            activePeriod.startedAt,

          endedAt:
            activePeriod.endedAt,

          createdAt:
            activePeriod.createdAt,
        },

        currentPrices: {
          WASH:
            currentWashPrice,

          DISINFECTION:
            currentDisinfectionPrice,
        },

        summary: {
          wash:
            activeSummary.wash,

          disinfection:
            activeSummary
              .disinfection,

          total:
            activeSummary.total,

          validation: {
            distributedTotal,

            expectedTotal:
              activeSummary.total
                .totalRevenue,

            difference:
              distributedTotal -
              activeSummary.total
                .totalRevenue,

            isValid:
              distributionIsValid,
          },
        },

        items: activeItems,

        previousPeriods:
          periodHistory,

        auditLogs,
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
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
        error:
          "A karbantartási összesítő lekérése nem sikerült.",

        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}
