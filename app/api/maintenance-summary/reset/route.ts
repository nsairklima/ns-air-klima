import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/*
 * Az aktuális elszámolási időszak
 * adatainak lekérése.
 */
export async function GET() {
  try {
    const activePeriod =
      await prisma.maintenanceSettlementPeriod.findFirst({
        where: {
          endedAt: null,
        },
        orderBy: {
          startedAt: "desc",
        },
        include: {
          items: {
            orderBy: {
              completedAt: "desc",
            },
          },
        },
      });

    if (!activePeriod) {
      return NextResponse.json({
        activePeriod: null,
        summary: {
          washCount: 0,
          disinfectionCount: 0,
          totalCount: 0,
          totalRevenue: 0,
          firstPersonTotal: 0,
          secondPersonTotal: 0,
        },
      });
    }

    const washItems =
      activePeriod.items.filter(
        (item) =>
          item.maintenanceType === "WASH"
      );

    const disinfectionItems =
      activePeriod.items.filter(
        (item) =>
          item.maintenanceType ===
          "DISINFECTION"
      );

    const washRevenue =
      washItems.reduce(
        (sum, item) =>
          sum + item.appliedPrice,
        0
      );

    const disinfectionRevenue =
      disinfectionItems.reduce(
        (sum, item) =>
          sum + item.appliedPrice,
        0
      );

    const firstPersonTotal =
      activePeriod.items.reduce(
        (sum, item) =>
          sum + item.firstPersonAmount,
        0
      );

    const secondPersonTotal =
      activePeriod.items.reduce(
        (sum, item) =>
          sum + item.secondPersonAmount,
        0
      );

    return NextResponse.json({
      activePeriod: {
        id: activePeriod.id,
        startedAt: activePeriod.startedAt,
        endedAt: activePeriod.endedAt,
        createdAt: activePeriod.createdAt,
      },

      summary: {
        washCount: washItems.length,

        disinfectionCount:
          disinfectionItems.length,

        totalCount:
          activePeriod.items.length,

        washRevenue,

        disinfectionRevenue,

        totalRevenue:
          washRevenue +
          disinfectionRevenue,

        firstPersonTotal,

        secondPersonTotal,
      },
    });
  } catch (error) {
    console.error(
      "Elszámolási időszak lekérési hiba:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Az elszámolási időszak lekérése sikertelen.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * Az aktuális elszámolási időszak
 * lezárása és új időszak indítása.
 *
 * A reset nem töröl:
 * - munkát,
 * - ügyfelet,
 * - gépet,
 * - árat,
 * - elszámolási tételt,
 * - korábbi naplóbejegyzést.
 */
export async function POST() {
  try {
    const now = new Date();

    const result =
      await prisma.$transaction(
        async (transaction) => {
          const activePeriod =
            await transaction.maintenanceSettlementPeriod.findFirst(
              {
                where: {
                  endedAt: null,
                },
                orderBy: {
                  startedAt: "desc",
                },
                include: {
                  items: true,
                },
              }
            );

          /*
           * Ha még egyetlen időszak sem létezik,
           * létrehozzuk az első aktív időszakot.
           */
          if (!activePeriod) {
            const firstPeriod =
              await transaction.maintenanceSettlementPeriod.create(
                {
                  data: {
                    startedAt: now,
                  },
                }
              );

            await transaction.maintenanceAuditLog.create(
              {
                data: {
                  eventType:
                    "PERIOD_RESET",

                  entityType:
                    "MaintenanceSettlementPeriod",

                  entityId:
                    firstPeriod.id,

                  description:
                    "Az első elszámolási időszak létrehozva.",

                  details: {
                    previousPeriodId: null,
                    newPeriodId:
                      firstPeriod.id,
                    resetAt:
                      now.toISOString(),
                    washCount: 0,
                    disinfectionCount: 0,
                    totalCount: 0,
                    totalRevenue: 0,
                    firstPersonTotal: 0,
                    secondPersonTotal: 0,
                  },
                },
              }
            );

            return {
              previousPeriod: null,
              newPeriod: firstPeriod,
              summary: {
                washCount: 0,
                disinfectionCount: 0,
                totalCount: 0,
                totalRevenue: 0,
                firstPersonTotal: 0,
                secondPersonTotal: 0,
              },
            };
          }

          /*
           * A lezárandó időszak értékeinek
           * összesítése a naplóhoz.
           */
          const washItems =
            activePeriod.items.filter(
              (item) =>
                item.maintenanceType ===
                "WASH"
            );

          const disinfectionItems =
            activePeriod.items.filter(
              (item) =>
                item.maintenanceType ===
                "DISINFECTION"
            );

          const totalRevenue =
            activePeriod.items.reduce(
              (sum, item) =>
                sum + item.appliedPrice,
              0
            );

          const firstPersonTotal =
            activePeriod.items.reduce(
              (sum, item) =>
                sum +
                item.firstPersonAmount,
              0
            );

          const secondPersonTotal =
            activePeriod.items.reduce(
              (sum, item) =>
                sum +
                item.secondPersonAmount,
              0
            );

          /*
           * A jelenlegi időszak lezárása.
           */
          const closedPeriod =
            await transaction.maintenanceSettlementPeriod.update(
              {
                where: {
                  id: activePeriod.id,
                },
                data: {
                  endedAt: now,
                },
              }
            );

          /*
           * Új, üres elszámolási időszak.
           */
          const newPeriod =
            await transaction.maintenanceSettlementPeriod.create(
              {
                data: {
                  startedAt: now,
                },
              }
            );

          /*
           * A reset teljes naplózása.
           */
          await transaction.maintenanceAuditLog.create(
            {
              data: {
                eventType:
                  "PERIOD_RESET",

                entityType:
                  "MaintenanceSettlementPeriod",

                entityId:
                  newPeriod.id,

                description:
                  "Az elszámolási számláló nullázva, új időszak indítva.",

                details: {
                  previousPeriodId:
                    closedPeriod.id,

                  previousPeriodStartedAt:
                    closedPeriod.startedAt.toISOString(),

                  previousPeriodEndedAt:
                    closedPeriod.endedAt
                      ? closedPeriod.endedAt.toISOString()
                      : now.toISOString(),

                  newPeriodId:
                    newPeriod.id,

                  newPeriodStartedAt:
                    newPeriod.startedAt.toISOString(),

                  resetAt:
                    now.toISOString(),

                  washCount:
                    washItems.length,

                  disinfectionCount:
                    disinfectionItems.length,

                  totalCount:
                    activePeriod.items.length,

                  totalRevenue,

                  firstPersonTotal,

                  secondPersonTotal,
                },
              },
            }
          );

          return {
            previousPeriod:
              closedPeriod,

            newPeriod,

            summary: {
              washCount:
                washItems.length,

              disinfectionCount:
                disinfectionItems.length,

              totalCount:
                activePeriod.items.length,

              totalRevenue,

              firstPersonTotal,

              secondPersonTotal,
            },
          };
        }
      );

    return NextResponse.json({
      success: true,

      message:
        result.previousPeriod
          ? "A korábbi időszak lezárult, az új elszámolási időszak nulláról elindult."
          : "Az első elszámolási időszak létrejött.",

      previousPeriod:
        result.previousPeriod
          ? {
              id:
                result.previousPeriod.id,

              startedAt:
                result.previousPeriod
                  .startedAt,

              endedAt:
                result.previousPeriod
                  .endedAt,
            }
          : null,

      newPeriod: {
        id: result.newPeriod.id,

        startedAt:
          result.newPeriod
            .startedAt,

        endedAt:
          result.newPeriod
            .endedAt,
      },

      closedPeriodSummary:
        result.summary,
    });
  } catch (error) {
    console.error(
      "Elszámolási időszak reset hiba:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Az új elszámolási időszak indítása sikertelen.",
      },
      {
        status: 500,
      }
    );
  }
}
