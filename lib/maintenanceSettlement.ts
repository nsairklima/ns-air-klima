import {
  MaintenanceAuditEventType,
  MaintenancePaymentMethod,
  MaintenanceReceiver,
  MaintenanceServiceType,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

type MachineDetail = {
  maintenanceType:
    | "mosas"
    | "fertotlenites"
    | "";
  warranty: boolean | null;
};

type SyncMaintenanceSettlementParams = {
  taskId: number;
  taskType: string;
  clientName: string;
  machines: string[];
  machineDetails: MachineDetail[];
  paymentMethod:
  | "keszpenz"
  | "atutalas"
  | null;
  completedAt: string | Date | null;
};

type CreatedSettlementItem = {
  id: number;
  taskId: number;
  machineIndex: number;
  machineName: string;
  maintenanceType:
    MaintenanceServiceType;
  appliedPrice: number;
  firstPersonAmount: number;
  secondPersonAmount: number;
  periodId: number;
  priceId: number;
};

type SettlementSyncResult = {
  createdItems:
    CreatedSettlementItem[];

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

function cleanText(
  value: unknown
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function parseCompletedAt(
  value: string | Date | null
): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(
      value.getTime()
    )
      ? null
      : value;
  }

  const normalizedValue =
    value.includes("T")
      ? value
      : value.replace(" ", "T");

  const parsedDate =
    new Date(normalizedValue);

  return Number.isNaN(
    parsedDate.getTime()
  )
    ? null
    : parsedDate;
}

function mapMaintenanceType(
  value:
    MachineDetail["maintenanceType"]
): MaintenanceServiceType | null {
  if (value === "mosas") {
    return MaintenanceServiceType.WASH;
  }

  if (
    value === "fertotlenites"
  ) {
    return (
      MaintenanceServiceType.DISINFECTION
    );
  }

  return null;
}

function getMaintenanceTypeLabel(
  value: MaintenanceServiceType
): string {
  return value ===
    MaintenanceServiceType.WASH
    ? "Mosás"
    : "Fertőtlenítés";
}

function isUniqueConstraintError(
  error: unknown
): boolean {
  return (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function syncMaintenanceSettlement({
  taskId,
  taskType,
  clientName,
  machines,
 machineDetails,
paymentMethod,
completedAt,
}: SyncMaintenanceSettlementParams):
  Promise<SettlementSyncResult> {
  const result:
    SettlementSyncResult = {
      createdItems: [],
      alreadyExistingItems: [],
      skippedItems: [],
      skipped: false,
      skipReason: null,
    };

  /*
   * Csak a karbantartási munkák
   * kerülhetnek elszámolásra.
   */
  if (
    taskType !== "karbantartas"
  ) {
    return {
      ...result,
      skipped: true,
      skipReason:
        "A munka nem karbantartás.",
    };
  }

  /*
   * Megvalósult időpont nélkül
   * nincs pénzügyi elszámolás.
   */
  const completedAtDate =
    parseCompletedAt(completedAt);

  let settlementPaymentMethod:
  MaintenancePaymentMethod | null =
    null;

let receivedBy:
  MaintenanceReceiver | null =
    null;

if (paymentMethod === "keszpenz") {
  settlementPaymentMethod =
    MaintenancePaymentMethod.CASH;

  receivedBy =
    MaintenanceReceiver.FIRST_PERSON;
} else if (
  paymentMethod === "atutalas"
) {
  settlementPaymentMethod =
    MaintenancePaymentMethod.TRANSFER;

  receivedBy =
    MaintenanceReceiver.SECOND_PERSON;
}

if (
  !settlementPaymentMethod ||
  !receivedBy
) {
  return {
    ...result,
    skipped: true,
    skipReason:
      "Nincs kiválasztva fizetési mód. Készpénz vagy átutalás megadása szükséges.",
  };
}

  if (!completedAtDate) {
    return {
      ...result,
      skipped: true,
      skipReason:
        "A munkának nincs érvényes megvalósult időpontja.",
    };
  }

  const cleanClientName =
    cleanText(clientName);

  const cleanMachines =
    Array.isArray(machines)
      ? machines.map((machine) =>
          cleanText(machine)
        )
      : [];

  if (cleanMachines.length === 0) {
    return {
      ...result,
      skipped: true,
      skipReason:
        "A munkához nincs megadott gép.",
    };
  }

  /*
   * Megkeressük az aktív időszakot.
   */
  let activePeriod =
    await prisma
      .maintenanceSettlementPeriod
      .findFirst({
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

  /*
   * Ha még nincs aktív időszak,
   * automatikusan létrehozzuk.
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
   * Minden gépet külön ellenőrzünk
   * és külön számolunk el.
   */
  for (
    let machineIndex = 0;
    machineIndex <
    cleanMachines.length;
    machineIndex += 1
  ) {
    const machineName =
      cleanMachines[machineIndex];

    if (!machineName) {
      result.skippedItems.push({
        machineIndex,
        machineName: "",
        reason:
          "A gép neve nincs megadva.",
      });

      continue;
    }

    const detail =
      machineDetails[
        machineIndex
      ];

    const maintenanceType =
      mapMaintenanceType(
        detail?.maintenanceType || ""
      );

    if (!maintenanceType) {
      result.skippedItems.push({
        machineIndex,
        machineName,
        reason:
          "Nincs megadva Mosás vagy Fertőtlenítés.",
      });

      continue;
    }

    /*
     * Először ellenőrizzük, hogy ezt
     * a gépet ennél a munkánál
     * elszámoltuk-e már.
     */
    const existingItem =
      await prisma
        .maintenanceSettlementItem
        .findUnique({
          where: {
            taskId_machineIndex: {
              taskId,
              machineIndex,
            },
          },

          select: {
            id: true,
          },
        });

    if (existingItem) {
      result.alreadyExistingItems.push({
        taskId,
        machineIndex,
        machineName,
      });

      continue;
    }

    /*
     * A megvalósult időpontban érvényes
     * legutolsó árat keressük meg.
     *
     * Ez biztosítja, hogy egy későbbi
     * árváltozás ne módosítsa visszamenőleg
     * a korábbi karbantartást.
     */
    const applicablePrice =
      await prisma
        .maintenancePrice
        .findFirst({
          where: {
            maintenanceType,

            validFrom: {
              lte: completedAtDate,
            },
          },

          orderBy: [
            {
              validFrom: "desc",
            },
            {
              id: "desc",
            },
          ],
        });

    if (!applicablePrice) {
      result.skippedItems.push({
        machineIndex,
        machineName,
        reason:
          `${getMaintenanceTypeLabel(
            maintenanceType
          )} típushoz nincs a teljesítés időpontjában érvényes ár.`,
      });

      continue;
    }

    /*
     * Még egyszer ellenőrizzük az ár
     * belső helyességét.
     */
    const distributedPrice =
      applicablePrice
        .firstPersonAmount +
      applicablePrice
        .secondPersonAmount;

    if (
      distributedPrice !==
      applicablePrice.totalPrice
    ) {
      result.skippedItems.push({
        machineIndex,
        machineName,
        reason:
          "Az alkalmazandó ár felosztása hibás.",
      });

      continue;
    }

    try {
      const createdItem =
        await prisma.$transaction(
          async (transaction) => {
            const settlementItem =
              await transaction
                .maintenanceSettlementItem
                .create({
                  data: {
                    taskId,
                    machineIndex,

                    clientName:
                      cleanClientName ||
                      null,

                    machineName,

                    maintenanceType,

paymentMethod:
  settlementPaymentMethod,

receivedBy,
                    
                    appliedPrice:
                      applicablePrice
                        .totalPrice,

                    firstPersonAmount:
                      applicablePrice
                        .firstPersonAmount,

                    secondPersonAmount:
                      applicablePrice
                        .secondPersonAmount,

                    completedAt:
                      completedAtDate,

                    periodId:
                      activePeriod.id,

                    priceId:
                      applicablePrice.id,
                  },
                });

            await transaction
              .maintenanceAuditLog
              .create({
                data: {
                  eventType:
                    MaintenanceAuditEventType
                      .SETTLEMENT_ITEM_CREATED,

                  entityType:
                    "MaintenanceSettlementItem",

                  entityId:
                    settlementItem.id,

                  description:
                    `${getMaintenanceTypeLabel(
                      maintenanceType
                    )} elszámolási tétel létrehozva.`,

                  details: {
                    settlementItemId:
                      settlementItem.id,

                    taskId,

                    machineIndex,

                    clientName:
                      cleanClientName ||
                      null,

                    machineName,

                    maintenanceType,

                    paymentMethod:
  settlementPaymentMethod,

receivedBy,

                    maintenanceTypeLabel:
                      getMaintenanceTypeLabel(
                        maintenanceType
                      ),

                    appliedPrice:
                      applicablePrice
                        .totalPrice,

                    firstPersonAmount:
                      applicablePrice
                        .firstPersonAmount,

                    secondPersonAmount:
                      applicablePrice
                        .secondPersonAmount,

                    completedAt:
                      completedAtDate,

                    periodId:
                      activePeriod.id,

                    priceId:
                      applicablePrice.id,

                    priceValidFrom:
                      applicablePrice
                        .validFrom,
                  },
                },
              });

            return settlementItem;
          }
        );

      result.createdItems.push({
        id: createdItem.id,
        taskId:
          createdItem.taskId,
        machineIndex:
          createdItem.machineIndex,
        machineName:
          createdItem.machineName,
        maintenanceType:
          createdItem
            .maintenanceType,
        appliedPrice:
          createdItem.appliedPrice,
        firstPersonAmount:
          createdItem
            .firstPersonAmount,
        secondPersonAmount:
          createdItem
            .secondPersonAmount,
        periodId:
          createdItem.periodId,
        priceId:
          createdItem.priceId,
      });
    } catch (error) {
      /*
       * A külön adatbázis-korlát is
       * megakadályozza a dupla tételt.
       */
      if (
        isUniqueConstraintError(error)
      ) {
        result
          .alreadyExistingItems
          .push({
            taskId,
            machineIndex,
            machineName,
          });

        continue;
      }

      throw error;
    }
  }

  return result;
}
