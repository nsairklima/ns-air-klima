import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/*
 * Az aktuális elszámolási időszak
 * adatainak lekérése.
 */
export async function GET() {*  try {
    const activePeriod =
 *    await prisma.maintenanceSettle*entPeriod.findFirst({
        wher*: {
          endedAt: null,
     *  },

        orderBy: {
         *startedAt: "desc",
        },

   *    include: {
          _count: {
            select: {
              items: true,
            },
          },
        },
      });

    /*
     * Ha még nincs aktív időszak,
     * automatikusan létrehozzuk az elsőt.
     */
    if (!activePeriod) {
      c*nst newPeriod =
        await pris*a.maintenanceSettlementPeriod.crea*e({
          data: {},
        })*

      return NextResponse.json({*        activePeriod: {
          *..newPeriod,
          itemCount: *,
        },

        created: tru*,
      });
    }

    return Next*esponse.json({
      activePeriod:*{
        id: activePeriod.id,
   *    startedAt: activePeriod.starte*At,
        endedAt: activePeriod.*ndedAt,
        createdAt: activeP*riod.createdAt,
        itemCount:*          activePeriod._count.item*,
      },

      created: false,
*   });
  } catch (error) {
    con*ole.error(
      "Aktuális elszámo*ási időszak lekérési hiba:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Az aktuális elszámolási időszak nem tölthető be.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * Aktuális számláló lezárása és
 * új elszámolási időszak indítása.
 */
export async function POST(
  request: Request
) {
  try {
    /*
     * A reset csak kifejezett megerősítéssel
     * hajtható végre.
     */
    let requestBody: {
      confirm?: boolean;
    } = {};

    try {
      requestBody =
        await request.json();
    } catch {
      requestBody = {};
    }

    if (requestBody.confirm !== true) {
      return NextResponse.json(
        {
          error:
            "A reset végrehajtásához megerősítés szükséges.",
        },
        {
          status: 400,
        }
      );
    }

    const resetTime = new Date();

    /*
     * A lezárás, az új időszak létrehozása
     * és a naplózás egy tranzakcióban történik.
     *
     * Ha bármelyik művelet hibát ad,
     * egyik változás sem kerül mentésre.
     */
    const resetResult =
      await prisma.$transaction(
        async (transaction) => {
          const activePeriod =
            await transaction
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
           * Ha még nincs aktív időszak,
           * létrehozzuk az első időszakot.
           */
          if (!activePeriod) {
            const firstPeriod =
              await transaction
                .maintenanceSettlementPeriod
                .create({
                  data: {
                    startedAt: resetTime,
                  },
                });

            await transaction
              .maintenanceAuditLog
              .create({
                data: {
                  eventType:
                    "PERIOD_RESET",

                  entityType:
                    "MaintenanceSettlementPeriod",

                  entityId:
                    firstPeriod.id,

                  description:
                    "Az első karbantartási elszámolási időszak létrehozva.",

                  details: {
                    previousPeriodId: null,
                    newPeriodId:
                      firstPeriod.id,
                    resetAt:
                      resetTime.toISOString(),
                    washCount: 0,
                    disinfectionCount: 0,
                    totalCount: 0,
                    totalRevenue: 0,
                    firstPersonTotal: 0,
                    secondPersonTotal: 0,
                  },
                },
              });

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

              initialized: true,
            };
          }

          /*
           * Lekérjük a lezárandó időszak
           * minden elszámolási tételét.
           */
          const settlementItems =
            await transaction
              .maintenanceSettlementItem
              .findMany({
                where: {
                  periodId:
                    activePeriod.id,
                },

                select: {
                  maintenanceType: true,
                  appliedPrice: true,
                  firstPersonAmount: true,
                  secondPersonAmount: true,
                },
              });

          let washCount = 0;
          let disinfectionCount = 0;
          let totalRevenue = 0;
          let firstPersonTotal = 0;
          let secondPersonTotal = 0;

          for (
            const item of settlementItems
          ) {
            if (
              item.maintenanceType ===
              "WASH"
            ) {
              washCount += 1;
            }

            if (
              item.maintenanceType ===
              "DISINFECTION"
            ) {
              disinfectionCount += 1;
            }

            totalRevenue +=
              item.appliedPrice;

            firstPersonTotal +=
              item.firstPersonAmount;

            secondPersonTotal +=
              item.secondPersonAmount;
          }

          const totalCount =
            settlementItems.length;

          /*
           * Ellenőrzés:
           * a személyenkénti összegeknek
           * egyezniük kell a teljes bevétellel.
           */
          const distributedTotal =
            firstPersonTotal +
            secondPersonTotal;

          if (
            distributedTotal !==
            totalRevenue
          ) {
            throw new Error(
              "A lezárandó időszak személyenkénti összegei nem egyeznek meg a teljes bevétellel."
            );
          }

          /*
           * Lezárjuk az aktuális időszakot.
           */
          const closedPeriod =
            await transaction
              .maintenanceSettlementPeriod
              .update({
                where: {
                  id: activePeriod.id,
                },

                data: {
                  endedAt: resetTime,
                },
              });

          /*
           * Létrehozzuk az új, nulláról
           * induló elszámolási időszakot.
           */
          const newPeriod =
            await transaction
              .maintenanceSettlementPeriod
              .create({
                data: {
                  startedAt: resetTime,
                },
              });

          /*
           * A reset minden fontos adatát
           * hozzáfűzzük a naplóhoz.
           */
          await transaction
            .maintenanceAuditLog
            .create({
              data: {
                eventType:
                  "PERIOD_RESET",

                entityType:
                  "MaintenanceSettlementPeriod",

                entityId:
                  closedPeriod.id,

                description:
                  `A(z) #${closedPeriod.id} elszámolási időszak lezárva. ` +
                  `Az új időszak azonosítója: #${newPeriod.id}.`,

                details: {
                  previousPeriodId:
                    closedPeriod.id,

                  newPeriodId:
                    newPeriod.id,

                  previousPeriodStartedAt:
                    closedPeriod.startedAt.toISOString(),

                  previousPeriodEndedAt:
                    resetTime.toISOString(),

                  newPeriodStartedAt:
                    newPeriod.startedAt.toISOString(),

                  resetAt:
                    resetTime.toISOString(),

                  washCount,

                  disinfectionCount,

                  totalCount,

                  totalRevenue,

                  firstPersonTotal,

                  secondPersonTotal,
                },
              },
            });

          return {
            previousPeriod:
              closedPeriod,

            newPeriod,

            summary: {
              washCount,
              disinfectionCount,
              totalCount,
              totalRevenue,
              firstPersonTotal,
              secondPersonTotal,
            },

            initialized: false,
          };
        }
      );

    return NextResponse.json({
      success: true,

      message:
        resetResult.initialized
          ? "Az első elszámolási időszak létrejött."
          : "Az előző elszámolási időszak lezárult. Az új számláló nulláról indul.",

      previousPeriod:
        resetResult.previousPeriod,

      newPeriod:
        resetResult.newPeriod,

      previousPeriodSummary:
        resetResult.summary,
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
            : "Az elszámolási időszak resetelése sikertelen.",
      },
      {
        status: 500,
      }
    );
  }
}
