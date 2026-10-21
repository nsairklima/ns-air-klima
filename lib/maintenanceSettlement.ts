import {
  MaintenanceAuditEventType,
  MaintenancePaymentMethod,
  MaintenanceReceiver,
  MaintenanceServiceType,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

type MachineDetail = {
  maintenanceType: "mosas" | "fertotlenites" | "";
  warranty: boolean | null;
};

type SyncMaintenanceSettlementParams = {
  taskId: number;
  taskType: string;
  clientName: string;
  machines: string[];
  machineDetails: MachineDetail[];
  paymentMethod: "keszpenz" | "atutalas" | null;
  completedAt: string | Date | null;
};

type CreatedSettlementItem = {
  id: number;
  taskId: number;
  machineIndex: number;
  machineName: string;
  maintenanceType: MaintenanceServiceType;
  appliedPrice: number;
  firstPersonAmount: number;
  secondPersonAmount: number;
  periodId: number;
  priceId: number;
};

type SettlementSyncResult = {
  createdItems: CreatedSettlementItem[];
  updatedItems: CreatedSettlementItem[];
  removedItems: Array<{
    id: number;
    taskId: number;
    machineIndex: number;
    machineName: string;
  }>;
  alreadyExistingItems: Array<{
    taskId: number;
    machineIndex: number;
    machineName: string;
  }>;
  skippedItems: Array<{
    machineIndex: number;
    machineName: string;
    reason: string;
  }>;
  skipped: boolean;
  skipReason: string | null;
};

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseCompletedAt(value: string | Date | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function mapMaintenanceType(
  value: MachineDetail["maintenanceType"]
): MaintenanceServiceType | null {
  if (value === "mosas") return MaintenanceServiceType.WASH;
  if (value === "fertotlenites") {
    return MaintenanceServiceType.DISINFECTION;
  }
  return null;
}

function mapPaymentMethod(
  value: "keszpenz" | "atutalas" | null
): {
  paymentMethod: MaintenancePaymentMethod;
  receivedBy: MaintenanceReceiver;
} | null {
  if (value === "keszpenz") {
    return {
      paymentMethod: MaintenancePaymentMethod.CASH,
      receivedBy: MaintenanceReceiver.FIRST_PERSON,
    };
  }

  if (value === "atutalas") {
    return {
      paymentMethod: MaintenancePaymentMethod.TRANSFER,
      receivedBy: MaintenanceReceiver.SECOND_PERSON,
    };
  }

  return null;
}

function getTypeLabel(value: MaintenanceServiceType): string {
  return value === MaintenanceServiceType.WASH ? "Mosás" : "Fertőtlenítés";
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function toResultItem(item: {
  id: number;
  taskId: number;
  machineIndex: number;
  machineName: string;
  maintenanceType: MaintenanceServiceType;
  appliedPrice: number;
  firstPersonAmount: number;
  secondPersonAmount: number;
  periodId: number;
  priceId: number;
}): CreatedSettlementItem {
  return {
    id: item.id,
    taskId: item.taskId,
    machineIndex: item.machineIndex,
    machineName: item.machineName,
    maintenanceType: item.maintenanceType,
    appliedPrice: item.appliedPrice,
    firstPersonAmount: item.firstPersonAmount,
    secondPersonAmount: item.secondPersonAmount,
    periodId: item.periodId,
    priceId: item.priceId,
  };
}

function auditSnapshot(item: {
  id: number;
  taskId: number;
  machineIndex: number;
  clientName: string | null;
  machineName: string;
  maintenanceType: MaintenanceServiceType;
  paymentMethod: MaintenancePaymentMethod | null;
  receivedBy: MaintenanceReceiver | null;
  appliedPrice: number;
  firstPersonAmount: number;
  secondPersonAmount: number;
  completedAt: Date;
  periodId: number;
  priceId: number;
  createdAt: Date;
}) {
  return {
    ...item,
    completedAt: item.completedAt.toISOString(),
    createdAt: item.createdAt.toISOString(),
  };
}

export async function syncMaintenanceSettlement({
  taskId,
  taskType,
  clientName,
  machines,
  machineDetails,
  paymentMethod,
  completedAt,
}: SyncMaintenanceSettlementParams): Promise<SettlementSyncResult> {
  const result: SettlementSyncResult = {
    createdItems: [],
    updatedItems: [],
    removedItems: [],
    alreadyExistingItems: [],
    skippedItems: [],
    skipped: false,
    skipReason: null,
  };

  const cleanClientName = cleanText(clientName);
  const cleanMachines = Array.isArray(machines)
    ? machines.map(cleanText)
    : [];

  const completedAtDate = parseCompletedAt(completedAt);
  const paymentData = mapPaymentMethod(paymentMethod);

  /*
   * Ha a munka már nem elszámolható, a korábban létrehozott
   * aktív tételeket naplózva eltávolítjuk.
   */
  if (
    taskType !== "karbantartas" ||
    !completedAtDate ||
    !paymentData
  ) {
    const oldItems = await prisma.maintenanceSettlementItem.findMany({
      where: { taskId },
      orderBy: { machineIndex: "asc" },
    });

    if (oldItems.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const item of oldItems) {
          await tx.maintenanceAuditLog.create({
            data: {
              eventType: MaintenanceAuditEventType.SETTLEMENT_ITEM_VOIDED,
              entityType: "MaintenanceSettlementItem",
              entityId: item.id,
              description:
                "Elszámolási tétel eltávolítva, mert a munka már nem elszámolható.",
              details: {
                reason:
                  taskType !== "karbantartas"
                    ? "A munka típusa már nem karbantartás."
                    : !completedAtDate
                      ? "A megvalósult időpont hiányzik vagy érvénytelen."
                      : "A fizetési mód hiányzik.",
                previousItem: auditSnapshot(item),
              },
            },
          });
        }

        await tx.maintenanceSettlementItem.deleteMany({
          where: { taskId },
        });
      });

      result.removedItems.push(
        ...oldItems.map((item) => ({
          id: item.id,
          taskId: item.taskId,
          machineIndex: item.machineIndex,
          machineName: item.machineName,
        }))
      );
    }

    return {
      ...result,
      skipped: true,
      skipReason:
        taskType !== "karbantartas"
          ? "A munka nem karbantartás."
          : !completedAtDate
            ? "A munkának nincs érvényes megvalósult időpontja."
            : "Nincs kiválasztva fizetési mód.",
    };
  }

  let activePeriod = await prisma.maintenanceSettlementPeriod.findFirst({
    where: { endedAt: null },
    orderBy: [{ startedAt: "desc" }, { id: "desc" }],
  });

  if (!activePeriod) {
    activePeriod = await prisma.maintenanceSettlementPeriod.create({
      data: { startedAt: new Date() },
    });
  }

  const activePeriodId = activePeriod.id;

  const existingItems = await prisma.maintenanceSettlementItem.findMany({
    where: { taskId },
    orderBy: { machineIndex: "asc" },
  });

  /*
   * A munkából törölt gépekhez tartozó, már felesleges tételek eltávolítása.
   */
  const staleItems = existingItems.filter(
    (item) => item.machineIndex >= cleanMachines.length
  );

  if (staleItems.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (const item of staleItems) {
        await tx.maintenanceAuditLog.create({
          data: {
            eventType: MaintenanceAuditEventType.SETTLEMENT_ITEM_VOIDED,
            entityType: "MaintenanceSettlementItem",
            entityId: item.id,
            description:
              "Elszámolási tétel eltávolítva, mert a gépet törölték a munkából.",
            details: {
              reason: "A gép indexe már nem létezik a munka géplistájában.",
              previousItem: auditSnapshot(item),
            },
          },
        });
      }

      await tx.maintenanceSettlementItem.deleteMany({
        where: { id: { in: staleItems.map((item) => item.id) } },
      });
    });

    result.removedItems.push(
      ...staleItems.map((item) => ({
        id: item.id,
        taskId: item.taskId,
        machineIndex: item.machineIndex,
        machineName: item.machineName,
      }))
    );
  }

  for (
    let machineIndex = 0;
    machineIndex < cleanMachines.length;
    machineIndex += 1
  ) {
    const machineName = cleanMachines[machineIndex];
    const detail = machineDetails[machineIndex];
    const maintenanceType = mapMaintenanceType(detail?.maintenanceType || "");

    if (!machineName) {
      result.skippedItems.push({
        machineIndex,
        machineName: "",
        reason: "A gép neve nincs megadva.",
      });
      continue;
    }

    const existingItem = existingItems.find(
      (item) => item.machineIndex === machineIndex
    );

    /*
     * Ha a gépről levették a Mosás/Fertőtlenítés választást,
     * a korábbi tételt naplózva eltávolítjuk.
     */
    if (!maintenanceType) {
      if (existingItem) {
        await prisma.$transaction(async (tx) => {
          await tx.maintenanceAuditLog.create({
            data: {
              eventType: MaintenanceAuditEventType.SETTLEMENT_ITEM_VOIDED,
              entityType: "MaintenanceSettlementItem",
              entityId: existingItem.id,
              description:
                "Elszámolási tétel eltávolítva, mert megszűnt a karbantartási típus.",
              details: {
                reason: "A gépnél nincs Mosás vagy Fertőtlenítés kiválasztva.",
                previousItem: auditSnapshot(existingItem),
              },
            },
          });

          await tx.maintenanceSettlementItem.delete({
            where: { id: existingItem.id },
          });
        });

        result.removedItems.push({
          id: existingItem.id,
          taskId,
          machineIndex,
          machineName,
        });
      } else {
        result.skippedItems.push({
          machineIndex,
          machineName,
          reason: "Nincs megadva Mosás vagy Fertőtlenítés.",
        });
      }
      continue;
    }

    const applicablePrice = await prisma.maintenancePrice.findFirst({
      where: {
        maintenanceType,
        validFrom: { lte: completedAtDate },
      },
      orderBy: [{ validFrom: "desc" }, { id: "desc" }],
    });

    if (!applicablePrice) {
      result.skippedItems.push({
        machineIndex,
        machineName,
        reason: `${getTypeLabel(maintenanceType)} típushoz nincs a teljesítés időpontjában érvényes ár.`,
      });
      continue;
    }

    if (
      applicablePrice.firstPersonAmount +
        applicablePrice.secondPersonAmount !==
      applicablePrice.totalPrice
    ) {
      result.skippedItems.push({
        machineIndex,
        machineName,
        reason: "Az alkalmazandó ár felosztása hibás.",
      });
      continue;
    }

    if (!existingItem) {
      try {
        const created = await prisma.$transaction(async (tx) => {
          const item = await tx.maintenanceSettlementItem.create({
            data: {
              taskId,
              machineIndex,
              clientName: cleanClientName || null,
              machineName,
              maintenanceType,
              paymentMethod: paymentData.paymentMethod,
              receivedBy: paymentData.receivedBy,
              appliedPrice: applicablePrice.totalPrice,
              firstPersonAmount: applicablePrice.firstPersonAmount,
              secondPersonAmount: applicablePrice.secondPersonAmount,
              completedAt: completedAtDate,
              periodId: activePeriodId,
              priceId: applicablePrice.id,
            },
          });

          await tx.maintenanceAuditLog.create({
            data: {
              eventType: MaintenanceAuditEventType.SETTLEMENT_ITEM_CREATED,
              entityType: "MaintenanceSettlementItem",
              entityId: item.id,
              description: `${getTypeLabel(maintenanceType)} elszámolási tétel létrehozva.`,
              details: { newItem: auditSnapshot(item) },
            },
          });

          return item;
        });

        result.createdItems.push(toResultItem(created));
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          result.alreadyExistingItems.push({
            taskId,
            machineIndex,
            machineName,
          });
          continue;
        }
        throw error;
      }

      continue;
    }

    /*
     * Már létező tétel teljes összehasonlítása.
     * Ha bármi változott, a típus, ár, felosztás, fizetés és időpont együtt frissül.
     */
    const hasChanges =
      existingItem.machineName !== machineName ||
      existingItem.clientName !== (cleanClientName || null) ||
      existingItem.maintenanceType !== maintenanceType ||
      existingItem.paymentMethod !== paymentData.paymentMethod ||
      existingItem.receivedBy !== paymentData.receivedBy ||
      existingItem.appliedPrice !== applicablePrice.totalPrice ||
      existingItem.firstPersonAmount !== applicablePrice.firstPersonAmount ||
      existingItem.secondPersonAmount !== applicablePrice.secondPersonAmount ||
      existingItem.priceId !== applicablePrice.id ||
      existingItem.completedAt.getTime() !== completedAtDate.getTime();

    if (!hasChanges) {
      result.alreadyExistingItems.push({
        taskId,
        machineIndex,
        machineName,
      });
      continue;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const item = await tx.maintenanceSettlementItem.update({
        where: { id: existingItem.id },
        data: {
          clientName: cleanClientName || null,
          machineName,
          maintenanceType,
          paymentMethod: paymentData.paymentMethod,
          receivedBy: paymentData.receivedBy,
          appliedPrice: applicablePrice.totalPrice,
          firstPersonAmount: applicablePrice.firstPersonAmount,
          secondPersonAmount: applicablePrice.secondPersonAmount,
          completedAt: completedAtDate,
          priceId: applicablePrice.id,
        },
      });

      await tx.maintenanceAuditLog.create({
        data: {
          eventType: MaintenanceAuditEventType.SETTLEMENT_ITEM_ADJUSTED,
          entityType: "MaintenanceSettlementItem",
          entityId: item.id,
          description:
            "Az elszámolási tétel automatikusan szinkronizálva a módosított munkával.",
          details: {
            correctionType: "AUTOMATIC_TASK_RECONCILIATION",
            previousItem: auditSnapshot(existingItem),
            newItem: item,
          },
        },
      });

      return item;
    });

    result.updatedItems.push(toResultItem(updated));
  }

  return result;
}
