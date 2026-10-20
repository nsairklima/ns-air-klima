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

function parseNonNegativeInteger(
  value: unknown
): number | null {
  if (
    typeof value !== "number" &&
    typeof value !== "string"
  ) {
    return null;
  }

  const normalizedValue =
    typeof value === "string"
      ? value
          .replace(/\s/g, "")
          .replace(/Ft/gi, "")
          .trim()
      : value;

  if (
    normalizedValue === "" ||
    normalizedValue === null
  ) {
    return null;
  }

  const parsedValue = Number(
    normalizedValue
  );

  if (
    !Number.isSafeInteger(parsedValue) ||
    parsedValue < 0
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
    value === "WASH" ||
    value === "mosas"
  ) {
    return MaintenanceServiceType.WASH;
  }

  if (
    value ===
      MaintenanceServiceType.DISINFECTION ||
    value === "DISINFECTION" ||
    value === "fertotlenites"
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
 * Lekéri:
 * - a Mosás legújabb árbeállítását;
 * - a Fertőtlenítés legújabb árbeállítását;
 * - a teljes ártörténetet.
 */
export async function GET() {
  try {
    const [
      currentWashPrice,
      currentDisinfectionPrice,
      priceHistory,
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

      prisma.maintenancePrice.findMany({
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
      currentPrices: {
        wash: currentWashPrice,
        disinfection:
          currentDisinfectionPrice,
      },
      history: priceHistory,
    });
  } catch (error) {
    console.error(
      "Karbantartási árak lekérési hibája:",
      error
    );

    return NextResponse.json(
      {
        error:
          "A karbantartási árak lekérése nem sikerült.",
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
        (await request.json()) as PriceRequestBody;
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
      parseNonNegativeInteger(
        body.totalPrice
      );

    const firstPersonAmount =
      parseNonNegativeInteger(
        body.firstPersonAmount
      );

    const secondPersonAmount =
      parseNonNegativeInteger(
        body.secondPersonAmount
      );

    if (!maintenanceType) {
      return NextResponse.json(
        {
          error:
            "Érvénytelen karbantartástípus. Engedélyezett érték: WASH vagy DISINFECTION.",
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
            "A teljes árnak nullánál nagyobb, egész forintösszegnek kell lennie.",
        },
        {
          status: 400,
        }
      );
    }

    if (totalPrice <= 0) {
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

    if (
      firstPersonAmount === null ||
      secondPersonAmount === null
    ) {
      return NextResponse.json(
        {
          error:
            "Mindkét személy részét egész forintban meg kell adni.",
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
        totalPrice -
        distributedTotal;

      const differenceMessage =
        difference > 0
          ? `Az elosztott összeg ${difference.toLocaleString(
              "hu-HU"
            )} Ft-tal kevesebb a teljes árnál.`
          : `Az elosztott összeg ${Math.abs(
              difference
            ).toLocaleString(
              "hu-HU"
            )} Ft-tal meghaladja a teljes árat.`;

      return NextResponse.json(
        {
          error:
            "A két személy része nem egyezik meg a teljes árral.",
          difference,
          differenceMessage,
          received: {
            totalPrice,
            firstPersonAmount,
            secondPersonAmount,
            distributedTotal,
          },
        },
        {
          status: 400,
        }
      );
    }

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
     * Ha minden érték változatlan,
     * nem készítünk fölösleges árverziót.
     */
    if (
      previousPrice &&
      previousPrice.totalPrice ===
        totalPrice &&
      previousPrice.firstPersonAmount ===
        firstPersonAmount &&
      previousPrice.secondPersonAmount ===
        secondPersonAmount
    ) {
      return NextResponse.json(
        {
          error:
            "Ez az ár és elosztás már jelenleg is érvényes.",
          currentPrice: previousPrice,
        },
        {
          status: 409,
        }
      );
    }

    /*
     * Az ár és a naplóbejegyzés
     * egy tranzakcióban készül el.
     *
     * Ha a napló mentése hibás,
     * az ár sem kerül mentésre.
     */
    const result =
      await prisma.$transaction(
        async (transaction) => {
          const newPrice =
            await transaction.maintenancePrice.create(
              {
                data: {
                  maintenanceType,
                  totalPrice,
                  firstPersonAmount,
                  secondPersonAmount,
                  validFrom:
                    new Date(),
                },
              }
            );

          await transaction.maintenanceAuditLog.create(
            {
              data: {
                eventType:
                  MaintenanceAuditEventType.PRICE_CREATED,

                entityType:
                  "MaintenancePrice",

                entityId: newPrice.id,

                description:
                  `${getMaintenanceTypeLabel(
                    maintenanceType
                  )} új árbeállítása`,

                details: {
                  maintenanceType,

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
            }
          );

          return newPrice;
        }
      );

    return NextResponse.json(
      {
        message:
          `${getMaintenanceTypeLabel(
            maintenanceType
          )} új ára sikeresen elmentve.`,

        price: result,

        validation: {
          totalPrice:
            result.totalPrice,
          firstPersonAmount:
            result.firstPersonAmount,
          secondPersonAmount:
            result.secondPersonAmount,
          distributedTotal:
            result.firstPersonAmount +
            result.secondPersonAmount,
          isBalanced: true,
        },
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
          "Az új karbantartási ár mentése nem sikerült.",
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
