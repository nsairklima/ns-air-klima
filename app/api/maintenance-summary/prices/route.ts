import { NextResponse } from "next/server";
import {
  MaintenanceAuditEventType,
  MaintenanceServiceType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PriceRequestBody = {
  maintenanceType?: unknown;
  totalPrice?: unknown;
  firstPersonAmount?: unknown;
  secondPersonAmount?: unknown;
};

function parseWholeNumber(
  value: unknown
): number | null {
  if (
    typeof value !== "number" &&
    typeof value !== "string"
  ) {
    return null;
  }

  if (
    typeof value === "string" &&
    value.trim() === ""
  ) {
    return null;
  }

  const parsedValue = Number(value);

  if (
    !Number.isFinite(parsedValue) ||
    !Number.isInteger(parsedValue)
  ) {
    return null;
  }

  return parsedValue;
}

function parseMaintenanceType(
  value: unknown
): MaintenanceServiceType | null {
  if (
    value ===
      MaintenanceServiceType.WASH ||
    value === "WASH"
  ) {
    return MaintenanceServiceType.WASH;
  }

  if (
    value ===
      MaintenanceServiceType.DISINFECTION ||
    value === "DISINFECTION"
  ) {
    return MaintenanceServiceType.DISINFECTION;
  }

  return null;
}

function getMaintenanceTypeLabel(
  maintenanceType:
    MaintenanceServiceType
): string {
  if (
    maintenanceType ===
    MaintenanceServiceType.WASH
  ) {
    return "Mosás";
  }

  return "Fertőtlenítés";
}

/*
 * GET
 *
 * Visszaadja mindkét karbantartástípus
 * legutolsó árbeállítását.
 */
export async function GET() {
  try {
    const [
      currentWashPrice,
      currentDisinfectionPrice,
    ] = await Promise.all([
      prisma.maintenancePrice.findFirst({
        where: {
          maintenanceType:
            MaintenanceServiceType.WASH,
        },
        orderBy: [
          {
            validFrom: "desc",
          },
          {
            id: "desc",
          },
        ],
      }),

      prisma.maintenancePrice.findFirst({
        where: {
          maintenanceType:
            MaintenanceServiceType.DISINFECTION,
        },
        orderBy: [
          {
            validFrom: "desc",
          },
          {
            id: "desc",
          },
        ],
      }),
    ]);

    return NextResponse.json({
      prices: {
        wash: currentWashPrice,
        disinfection:
          currentDisinfectionPrice,
      },
    });
  } catch (error) {
    console.error(
      "Karbantartási árak lekérési hibája:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Az árak lekérése sikertelen.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * POST
 *
 * Új árverziót hoz létre.
 * Korábbi árat soha nem módosít.
 */
export async function POST(
  request: Request
) {
  try {
    let body: PriceRequestBody;

    try {
      body =
        (await request.json()) as
          PriceRequestBody;
    } catch {
      return NextResponse.json(
        {
          error:
            "A kérés nem tartalmaz érvényes JSON-adatot.",
        },
        {
          status: 400,
        }
      );
    }

    const maintenanceType =
      parseMaintenanceType(
        body.maintenanceType
      );

    const totalPrice =
      parseWholeNumber(
        body.totalPrice
      );

    const firstPersonAmount =
      parseWholeNumber(
        body.firstPersonAmount
      );

    const secondPersonAmount =
      parseWholeNumber(
        body.secondPersonAmount
      );

    if (!maintenanceType) {
      return NextResponse.json(
        {
          error:
            "Érvénytelen karbantartástípus.",
        },
        {
          status: 400,
        }
      );
    }

    if (totalPrice === null) {
      return NextResponse.json(
        {
          error:
            "A teljes ár csak egész szám lehet.",
        },
        {
          status: 400,
        }
      );
    }

    if (firstPersonAmount === null) {
      return NextResponse.json(
        {
          error:
            "Az első személy része csak egész szám lehet.",
        },
        {
          status: 400,
        }
      );
    }

    if (secondPersonAmount === null) {
      return NextResponse.json(
        {
          error:
            "A második személy része csak egész szám lehet.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      totalPrice < 0 ||
      firstPersonAmount < 0 ||
      secondPersonAmount < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Az összegek nem lehetnek negatívak.",
        },
        {
          status: 400,
        }
      );
    }

    if (totalPrice === 0) {
      return NextResponse.json(
        {
          error:
            "A teljes árnak nullánál nagyobbnak kell lennie.",
        },
        {
          status: 400,
        }
      );
    }

    const distributedTotal =
      firstPersonAmount +
      secondPersonAmount;

    if (
      distributedTotal !== totalPrice
    ) {
      const difference =
        totalPrice - distributedTotal;

      const differenceMessage =
        difference > 0
          ? `Az elosztott összegek ${difference.toLocaleString(
              "hu-HU"
            )} Ft-tal kevesebbek a teljes árnál.`
          : `Az elosztott összegek ${Math.abs(
              difference
            ).toLocaleString(
              "hu-HU"
            )} Ft-tal meghaladják a teljes árat.`;

      return NextResponse.json(
        {
          error: differenceMessage,
          validation: {
            totalPrice,
            firstPersonAmount,
            secondPersonAmount,
            distributedTotal,
            difference,
            isValid: false,
          },
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Lekérjük az eddigi legutolsó árat,
     * hogy a naplóban megmaradjon,
     * milyen értékekről változott.
     */
    const previousPrice =
      await prisma.maintenancePrice.findFirst(
        {
          where: {
            maintenanceType,
          },
          orderBy: [
            {
              validFrom: "desc",
            },
            {
              id: "desc",
            },
          ],
        }
      );

    /*
     * Az új ár és a naplóbejegyzés
     * egyetlen tranzakcióban készül el.
     *
     * Így nem fordulhat elő olyan állapot,
     * hogy az ár elmentődik, de a napló nem.
     */
    const result =
      await prisma.$transaction(
        async (transaction) => {
          const newPrice =
            await transaction
              .maintenancePrice
              .create({
                data: {
                  maintenanceType,
                  totalPrice,
                  firstPersonAmount,
                  secondPersonAmount,
                },
              });

          const typeLabel =
            getMaintenanceTypeLabel(
              maintenanceType
            );

          const auditLog =
            await transaction
              .maintenanceAuditLog
              .create({
                data: {
                  eventType:
                    MaintenanceAuditEventType.PRICE_CREATED,

                  entityType:
                    "MaintenancePrice",

                  entityId:
                    newPrice.id,

                  description:
                    `${typeLabel} új árverziója létrehozva.`,

                  details: {
                    maintenanceType,
                    maintenanceTypeLabel:
                      typeLabel,

                    previousPrice:
                      previousPrice
                        ? {
                            id:
                              previousPrice.id,

                            totalPrice:
                              previousPrice.totalPrice,

                            firstPersonAmount:
                              previousPrice.firstPersonAmount,

                            secondPersonAmount:
                              previousPrice.secondPersonAmount,

                            validFrom:
                              previousPrice.validFrom,
                          }
                        : null,

                    newPrice: {
                      id: newPrice.id,
                      totalPrice:
                        newPrice.totalPrice,

                      firstPersonAmount:
                        newPrice.firstPersonAmount,

                      secondPersonAmount:
                        newPrice.secondPersonAmount,

                      validFrom:
                        newPrice.validFrom,
                    },
                  },
                },
              });

          return {
            newPrice,
            auditLog,
          };
        }
      );

    return NextResponse.json(
      {
        message:
          "Az új árverzió sikeresen elmentve.",

        price: result.newPrice,

        validation: {
          totalPrice,
          firstPersonAmount,
          secondPersonAmount,
          distributedTotal,
          difference: 0,
          isValid: true,
        },

        previousPrice,

        auditLogId:
          result.auditLog.id,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Karbantartási ár mentési hibája:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Az ár mentése sikertelen.",
      },
      {
        status: 500,
      }
    );
  }
}
