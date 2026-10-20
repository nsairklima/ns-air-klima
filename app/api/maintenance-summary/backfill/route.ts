import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

import {
  MaintenanceAuditEventType,
  MaintenancePaymentMethod,
  MaintenanceReceiver,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  syncMaintenanceSettlement,
} from "@/lib/maintenanceSettlement";

export const dynamic = "force-dynamic";

const sql = neon(
  process.env.POSTGRES_URL || ""
);

type MachineDetail = {
  maintenanceType:
    | "mosas"
    | "fertotlenites"
    | "";

  warranty:
    | boolean
    | null;
};

function cleanText(
  value: unknown
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function parseStringArray(
  value: unknown
): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        cleanText(item)
      )
      .filter(Boolean);
  }

  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return [];
  }

  try {
    const parsed =
      JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) =>
        cleanText(item)
      )
      .filter(Boolean);
  } catch {
    return [];
  }
}

function parseMachineDetails(
  value: unknown
): MachineDetail[] {
  let parsedValue:
    unknown = value;

  if (
    typeof value === "string"
  ) {
    try {
      parsedValue =
        JSON.parse(value);
    } catch {
      return [];
    }
  }

  if (
    !Array.isArray(parsedValue)
  ) {
    return [];
  }

  return parsedValue.map(
    (detail): MachineDetail => {
      const maintenanceType =
        detail?.maintenanceType ===
          "mosas" ||
        detail?.maintenanceType ===
          "fertotlenites"
          ? detail.maintenanceType
          : "";

      const warranty =
        detail?.warranty === true
          ? true
          : detail?.warranty === false
            ? false
            : null;

      return {
        maintenanceType,
        warranty,
      };
    }
  );
}

function parsePaymentMethod(
  value: unknown
):
  | "keszpenz"
  | "atutalas"
  | null {
  if (value === "keszpenz") {
    return "keszpenz";
  }

  if (value === "atutalas") {
    return "atutalas";
  }

  return null;
}

function getSettlementPaymentData(
  paymentMethod:
    | "keszpenz"
    | "atutalas"
) {
  if (
    paymentMethod ===
    "keszpenz"
  ) {
    return {
      paymentMethod:
        MaintenancePaymentMethod.CASH,

      receivedBy:
        MaintenanceReceiver
          .FIRST_PERSON,

      paymentMethodLabel:
        "Készpénz",

      receivedByLabel:
        "1. fő",
    };
  }

  return {
    paymentMethod:
      MaintenancePaymentMethod
        .TRANSFER,

    receivedBy:
      MaintenanceReceiver
        .SECOND_PERSON,

    paymentMethodLabel:
      "Átutalás",

    receivedByLabel:
      "2. fő",
  };
}

export async function POST() {
  try {
    /*
     * Csak teljesített karbantartási
     * munkákat kérünk le.
     */
    const tasks = await sql`
      SELECT
        "id",
        "clientName",
        "machines",
        "machineDetails",
        "paymentMethod",
        "completed_at"
      FROM "Task"
      WHERE
        "type" = 'karbantartas'
        AND "completed_at" IS NOT NULL
      ORDER BY "id" ASC
    `;

    const result = {
      taskCount:
        tasks.length,

      createdItemCount: 0,

      completedExistingItemCount: 0,

      alreadyCompleteItemCount: 0,

      skippedTaskCount: 0,

      errorCount: 0,

      createdItems: [] as Array<{
        taskId: number;
        machineIndex: number;
        machineName: string;
      }>,

      completedExistingItems:
        [] as Array<{
          itemId: number;
          taskId: number;
          machineIndex: number;
          paymentMethod: string;
          receivedBy: string;
        }>,

      skippedTasks: [] as Array<{
        taskId: number;
        reason: string;
      }>,

      errors: [] as Array<{
        taskId: number;
        error: string;
      }>,
    };

    for (const task of tasks) {
      const taskId =
        Number(task.id);

      const clientName =
        cleanText(
          task.clientName
        );

      const machines =
        parseStringArray(
          task.machines
        );

      const machineDetails =
        parseMachineDetails(
          task.machineDetails
        );

      const paymentMethod =
        parsePaymentMethod(
          task.paymentMethod
        );

      const completedAt =
        task.completed_at
          ? String(
              task.completed_at
            )
          : null;

      if (!paymentMethod) {
        result.skippedTaskCount +=
          1;

        result.skippedTasks.push({
          taskId,

          reason:
            "Nincs Készpénz vagy Átutalás fizetési mód megadva.",
        });

        continue;
      }

      if (
        machines.length === 0
      ) {
        result.skippedTaskCount +=
          1;

        result.skippedTasks.push({
          taskId,

          reason:
            "Nincs megadott gép.",
        });

        continue;
      }

      const paymentData =
        getSettlementPaymentData(
          paymentMethod
        );

      try {
        /*
         * Elsőként kiegészítjük azokat
         * a tételeket, amelyek már
         * léteznek, de még nincs bennük
         * fizetési mód vagy fogadó.
         */
        const existingItems =
          await prisma
            .maintenanceSettlementItem
            .findMany({
              where: {
                taskId,
              },

              orderBy: {
                machineIndex:
                  "asc",
              },
            });

        for (
          const existingItem
          of existingItems
        ) {
          if (
            existingItem
              .paymentMethod &&
            existingItem.receivedBy
          ) {
            result
              .alreadyCompleteItemCount +=
              1;

            continue;
          }

          await prisma.$transaction(
            async (
              transaction
            ) => {
              const updatedItem =
                await transaction
                  .maintenanceSettlementItem
                  .update({
                    where: {
                      id:
                        existingItem.id,
                    },

                    data: {
                      paymentMethod:
                        paymentData
                          .paymentMethod,

                      receivedBy:
                        paymentData
                          .receivedBy,
                    },
                  });

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
                      "A meglévő elszámolási tétel fizetési adatai automatikusan kiegészítve.",

                    details: {
                      correctionType:
                        "AUTOMATIC_PAYMENT_BACKFILL",

                      correctionReason:
                        "A fizetési mód visszatöltve a munkából.",

                      taskId,

                      settlementItemId:
                        updatedItem.id,

                      machineIndex:
                        updatedItem
                          .machineIndex,

                      machineName:
                        updatedItem
                          .machineName,

                      previousValues: {
                        paymentMethod:
                          existingItem
                            .paymentMethod,

                        receivedBy:
                          existingItem
                            .receivedBy,
                      },

                      newValues: {
                        paymentMethod:
                          paymentData
                            .paymentMethod,

                        paymentMethodLabel:
                          paymentData
                            .paymentMethodLabel,

                        receivedBy:
                          paymentData
                            .receivedBy,

                        receivedByLabel:
                          paymentData
                            .receivedByLabel,
                      },
                    },
                  },
                });

              result
                .completedExistingItemCount +=
                1;

              result
                .completedExistingItems
                .push({
                  itemId:
                    updatedItem.id,

                  taskId,

                  machineIndex:
                    updatedItem
                      .machineIndex,

                  paymentMethod:
                    paymentData
                      .paymentMethod,

                  receivedBy:
                    paymentData
                      .receivedBy,
                });
            }
          );
        }

        /*
         * Ezután létrehozzuk a még
         * teljesen hiányzó tételeket.
         *
         * A segédfüggvény a már létező
         * taskId + machineIndex párokat
         * automatikusan kihagyja.
         */
        const syncResult =
          await syncMaintenanceSettlement({
            taskId,

            taskType:
              "karbantartas",

            clientName,

            machines,

            machineDetails,

            paymentMethod,

            completedAt,
          });

        result.createdItemCount +=
          syncResult
            .createdItems.length;

        for (
          const createdItem
          of syncResult.createdItems
        ) {
          result.createdItems.push({
            taskId:
              createdItem.taskId,

            machineIndex:
              createdItem
                .machineIndex,

            machineName:
              createdItem
                .machineName,
          });
        }

        /*
         * A segédfüggvény által kihagyott
         * tételeket is láthatóvá tesszük.
         */
        if (
          syncResult.skipped &&
          syncResult.skipReason
        ) {
          result.skippedTaskCount +=
            1;

          result.skippedTasks.push({
            taskId,

            reason:
              syncResult
                .skipReason,
          });
        }

        for (
          const skippedItem
          of syncResult.skippedItems
        ) {
          result.skippedTaskCount +=
            1;

          result.skippedTasks.push({
            taskId,

            reason:
              `Gép #${
                skippedItem
                  .machineIndex + 1
              } (${skippedItem.machineName || "névtelen"}): ${skippedItem.reason}`,
          });
        }
      } catch (error) {
        result.errorCount += 1;

        result.errors.push({
          taskId,

          error:
            error instanceof Error
              ? error.message
              : String(error),
        });
      }
    }

    return NextResponse.json(
      {
        message:
          "A meglévő karbantartási munkák automatikus feldolgozása befejeződött.",

        result,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Karbantartási visszatöltési hiba:",
      error
    );

    return NextResponse.json(
      {
        error:
          "A meglévő karbantartások visszatöltése nem sikerült.",

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
