import { NextResponse } from "next/server";
import {
  MaintenanceAuditEventType,
  MaintenanceServiceType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type CorrectionRequestBody = {
  maintenanceType?: unknown;
  machineName?: unknown;
  appliedPrice?: unknown;
  firstPersonAmount?: unknown;
  secondPersonAmount?: unknown;
  completedAt?: unknown;
  reason?: unknown;
};

function cleanText(
  value: unknown
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function parseInteger(
  value: unknown
): number | null {
  if (
    typeof value === "number" &&
    Number.isInteger(value)
  ) {
    return value;
  }

  if (typeof value === "string") {
    const cleanedValue = value
      .replace(/\s+/g, "")
      .replace(/Ft/gi, "")
      .trim();

    if (!cleanedValue) {
      return null;
    }

    const parsedValue =
      Number(cleanedValue);

    return Number.isInteger(parsedValue)
      ? parsedValue
      : null;
  }

  return null;
}

function parseMaintenanceType(
  value: unknown
): MaintenanceServiceType | null {
  if (
    value === "WASH" ||
    value === "mosas" ||
    value ===
      MaintenanceServiceType.WASH
  ) {
    return MaintenanceServiceType.WASH;
  }

  if (
    value === "DISINFECTION" ||
    value === "fertotlenites" ||
    value ===
      MaintenanceServiceType.DISINFECTION
  ) {
    return (
      MaintenanceServiceType.DISINFECTION
    );
  }

  return null;
}

function parseDate(
  value: unknown
): Date | null {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return null;
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

function getMaintenanceTypeLabel(
  value: MaintenanceServiceType
): string {
  return value ===
    MaintenanceServiceType.WASH
    ? "Mosás"
    : "Fertőtlenítés";
}

export async function PATCH(
  request: Request,
  props: {
    params:
      | Promise<{ id: string }>
      | { id: string };
  }
) {
  try {
    const params =
      await props.params;

    const settlementItemId =
      Number(params.id);

    if (
      !Number.isInteger(
        settlementItemId
      ) ||
      settlementItemId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Érvénytelen elszámolási tételazonosító.",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      (await request.json()) as
        CorrectionRequestBody;

    /*
     * A korrekció indoklása kötelező.
     */
    const reason =
      cleanText(body.reason);

    if (reason.length < 5) {
      return NextResponse.json(
        {
          error:
            "A korrekció indoklása kötelező, és legalább 5 karakter hosszú legyen.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Megkeressük az eredeti tételt.
     */
    const existingItem =
      await prisma
        .maintenanceSettlementItem
        .findUnique({
          where: {
            id: settlementItemId,
          },

          include: {
            price: true,
            period: true,
          },
        });

    if (!existingItem) {
      return NextResponse.json(
        {
          error:
            "Az elszámolási tétel nem található.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Ha egy mező nincs elküldve,
     * megtartjuk a korábbi értékét.
     */
    const maintenanceType =
      body.maintenanceType ===
        undefined
        ? existingItem
            .maintenanceType
        : parseMaintenanceType(
            body.maintenanceType
          );

    if (!maintenanceType) {
      return NextResponse.json(
        {
          error:
            "Érvénytelen karbantartási típus.",
        },
        {
          status: 400,
        }
      );
    }

    const machineName =
      body.machineName === undefined
        ? existingItem.machineName
        : cleanText(
            body.machineName
          );

    if (!machineName) {
      return NextResponse.json(
        {
          error:
            "A gép neve nem lehet üres.",
        },
        {
          status: 400,
        }
      );
    }

    const appliedPrice =
      body.appliedPrice === undefined
        ? existingItem.appliedPrice
        : parseInteger(
            body.appliedPrice
          );

    const firstPersonAmount =
      body.firstPersonAmount ===
        undefined
        ? existingItem
            .firstPersonAmount
        : parseInteger(
            body.firstPersonAmount
          );

    const secondPersonAmount =
      body.secondPersonAmount ===
        undefined
        ? existingItem
            .secondPersonAmount
        : parseInteger(
            body.secondPersonAmount
          );

    if (
      appliedPrice === null ||
      firstPersonAmount === null ||
      secondPersonAmount === null
    ) {
      return NextResponse.json(
        {
          error:
            "A teljes árat és mindkét személy részét egész forintban kell megadni.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      appliedPrice < 0 ||
      firstPersonAmount < 0 ||
      secondPersonAmount < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Negatív összeg nem adható meg.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * A két személy összege kötelezően
     * egyezzen a teljes árral.
     */
    const distributedTotal =
      firstPersonAmount +
      secondPersonAmount;

    if (
      distributedTotal !==
      appliedPrice
    ) {
      const difference =
        distributedTotal -
        appliedPrice;

      return NextResponse.json(
        {
          error:
            "A két személy része nem egyezik meg a teljes árral.",

          details:
            difference > 0
              ? `Az elosztás ${difference.toLocaleString(
                  "hu-HU"
                )} Ft-tal meghaladja a teljes árat.`
              : `Az elosztás ${Math.abs(
                  difference
                ).toLocaleString(
                  "hu-HU"
                )} Ft-tal kevesebb a teljes árnál.`,

          validation: {
            appliedPrice,
            firstPersonAmount,
            secondPersonAmount,
            distributedTotal,
            difference,
          },
        },
        {
          status: 400,
        }
      );
    }

    const completedAt =
      body.completedAt === undefined
        ? existingItem.completedAt
        : parseDate(
            body.completedAt
          );

    if (!completedAt) {
      return NextResponse.json(
        {
          error:
            "Érvénytelen megvalósult időpont.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Ha semmi nem változott, nem készítünk
     * felesleges korrekciós naplót.
     */
    const hasChanges =
      existingItem
        .maintenanceType !==
        maintenanceType ||
      existingItem.machineName !==
        machineName ||
      existingItem.appliedPrice !==
        appliedPrice ||
      existingItem
        .firstPersonAmount !==
        firstPersonAmount ||
      existingItem
        .secondPersonAmount !==
        secondPersonAmount ||
      existingItem.completedAt
        .getTime() !==
        completedAt.getTime();

    if (!hasChanges) {
      return NextResponse.json(
        {
          error:
            "Nem történt módosítás az elszámolási tételben.",
          item: existingItem,
        },
        {
          status: 409,
        }
      );
    }

    /*
     * A módosítás és a naplóbejegyzés
     * egyetlen tranzakcióban készül el.
     *
     * Ha a naplómentés sikertelen,
     * maga a korrekció sem marad bent.
     */
    const result =
      await prisma.$transaction(
        async (transaction) => {
          const updatedItem =
            await transaction
              .maintenanceSettlementItem
              .update({
                where: {
                  id: settlementItemId,
                },

                data: {
                  machineName,
                  maintenanceType,
                  appliedPrice,
                  firstPersonAmount,
                  secondPersonAmount,
                  completedAt,
                },
              });

          const auditLog =
            await transaction
              .maintenanceAuditLog
              .create({
                data: {
                  eventType:
                    MaintenanceAuditEventType
                      .SETTLEMENT_ITEM_ADJUSTED,

                  entityType:
                    "MaintenanceSettlementItem",

                  entityId:
                    updatedItem.id,

                  description:
                    `${getMaintenanceTypeLabel(
                      maintenanceType
                    )} elszámolási tétel kézzel korrigálva. Indok: ${reason}`,

                  details: {
                    correctionReason:
                      reason,

                    originalItem: {
                      id:
                        existingItem.id,

                      taskId:
                        existingItem
                          .taskId,

                      machineIndex:
                        existingItem
                          .machineIndex,

                      clientName:
                        existingItem
                          .clientName,

                      machineName:
                        existingItem
                          .machineName,

                      maintenanceType:
                        existingItem
                          .maintenanceType,

                      appliedPrice:
                        existingItem
                          .appliedPrice,

                      firstPersonAmount:
                        existingItem
                          .firstPersonAmount,

                      secondPersonAmount:
                        existingItem
                          .secondPersonAmount,

                      completedAt:
                        existingItem
                          .completedAt,

                      periodId:
                        existingItem
                          .periodId,

                      priceId:
                        existingItem
                          .priceId,

                      createdAt:
                        existingItem
                          .createdAt,
                    },

                    correctedItem: {
                      id:
                        updatedItem.id,

                      taskId:
                        updatedItem.taskId,

                      machineIndex:
                        updatedItem
                          .machineIndex,

                      clientName:
                        updatedItem
                          .clientName,

                      machineName:
                        updatedItem
                          .machineName,

                      maintenanceType:
                        updatedItem
                          .maintenanceType,

                      appliedPrice:
                        updatedItem
                          .appliedPrice,

                      firstPersonAmount:
                        updatedItem
                          .firstPersonAmount,

                      secondPersonAmount:
                        updatedItem
                          .secondPersonAmount,

                      completedAt:
                        updatedItem
                          .completedAt,

                      periodId:
                        updatedItem
                          .periodId,

                      priceId:
                        updatedItem
                          .priceId,

                      createdAt:
                        updatedItem
                          .createdAt,
                    },

                    differences: {
                      machineName:
                        existingItem
                          .machineName !==
                        updatedItem
                          .machineName
                          ? {
                              before:
                                existingItem
                                  .machineName,

                              after:
                                updatedItem
                                  .machineName,
                            }
                          : null,

                      maintenanceType:
                        existingItem
                          .maintenanceType !==
                        updatedItem
                          .maintenanceType
                          ? {
                              before:
                                existingItem
                                  .maintenanceType,

                              after:
                                updatedItem
                                  .maintenanceType,
                            }
                          : null,

                      appliedPrice:
                        existingItem
                          .appliedPrice !==
                        updatedItem
                          .appliedPrice
                          ? {
                              before:
                                existingItem
                                  .appliedPrice,

                              after:
                                updatedItem
                                  .appliedPrice,
                            }
                          : null,

                      firstPersonAmount:
                        existingItem
                          .firstPersonAmount !==
                        updatedItem
                          .firstPersonAmount
                          ? {
                              before:
                                existingItem
                                  .firstPersonAmount,

                              after:
                                updatedItem
                                  .firstPersonAmount,
                            }
                          : null,

                      secondPersonAmount:
                        existingItem
                          .secondPersonAmount !==
                        updatedItem
                          .secondPersonAmount
                          ? {
                              before:
                                existingItem
                                  .secondPersonAmount,

                              after:
                                updatedItem
                                  .secondPersonAmount,
                            }
                          : null,

                      completedAt:
                        existingItem.completedAt
                          .getTime() !==
                        updatedItem.completedAt
                          .getTime()
                          ? {
                              before:
                                existingItem
                                  .completedAt,

                              after:
                                updatedItem
                                  .completedAt,
                            }
                          : null,
                    },
                  },
                },
              });

          return {
            updatedItem,
            auditLog,
          };
        }
      );

    return NextResponse.json(
      {
        message:
          "Az elszámolási tétel sikeresen korrigálva és naplózva.",

        item:
          result.updatedItem,

        auditLogId:
          result.auditLog.id,

        correctionReason:
          reason,

        validation: {
          appliedPrice:
            result.updatedItem
              .appliedPrice,

          firstPersonAmount:
            result.updatedItem
              .firstPersonAmount,

          secondPersonAmount:
            result.updatedItem
              .secondPersonAmount,

          distributedTotal:
            result.updatedItem
              .firstPersonAmount +
            result.updatedItem
              .secondPersonAmount,

          isValid:
            result.updatedItem
              .firstPersonAmount +
              result.updatedItem
                .secondPersonAmount ===
            result.updatedItem
              .appliedPrice,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Elszámolási korrekciós hiba:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Az elszámolási tétel korrekciója nem sikerült.",

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
