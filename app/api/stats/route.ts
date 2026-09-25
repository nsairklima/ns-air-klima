import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const today = new Date();
    const currentYear = today.getFullYear();

    /*
     * Az URL-ből kiolvassuk a kiválasztott éveket.
     *
     * Példa:
     * /api/stats?years=2024,2025,2026
     */
    const yearsParam = req.nextUrl.searchParams.get("years");

    const selectedYears = yearsParam
      ? Array.from(
          new Set(
            yearsParam
              .split(",")
              .map((year) => Number(year.trim()))
              .filter(
                (year) =>
                  Number.isInteger(year) &&
                  year >= 2000 &&
                  year <= 2100
              )
          )
        ).sort((a, b) => a - b)
      : [currentYear];

    /*
     * Ha valamiért nem érkezett érvényes év,
     * akkor az aktuális évet használjuk.
     */
    const safeSelectedYears =
      selectedYears.length > 0
        ? selectedYears
        : [currentYear];

    /*
     * Minden olyan év lekérése, amelyben van ajánlat.
     * Ez alapján készülnek majd az évválasztó gombok.
     */
    const allQuoteDates = await prisma.quote.findMany({
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const availableYears = Array.from(
      new Set([
        currentYear,
        ...allQuoteDates.map((quote) =>
          new Date(quote.createdAt).getFullYear()
        ),
      ])
    ).sort((a, b) => b - a);

    // Ügyfél- és gépstatisztikák
    const totalClients = await prisma.client.count();

    const units = await prisma.clientUnit.findMany({
      include: {
        maintenance: {
          orderBy: {
            performedDate: "desc",
          },
          take: 1,
        },
      },
    });

    const urgentCount = units.filter((unit) => {
      if (unit.maintenance.length === 0) {
        return true;
      }

      const lastDate = new Date(
        unit.maintenance[0].performedDate
      );

      const diffDays = Math.ceil(
        Math.abs(
          today.getTime() - lastDate.getTime()
        ) /
          (1000 * 60 * 60 * 24)
      );

      return diffDays >= 330;
    }).length;

    // Raktárstatisztika
    let inventoryTotalValue = 0;
    let totalStockCount = 0;
    let totalItemsCount = 0;

    try {
      const items = await prisma.item.findMany();

      totalItemsCount = items.length;

      items.forEach((item) => {
        const quantity = Number(item.stock || 0);
        const price = Number(item.price || 0);

        inventoryTotalValue += quantity * price;
        totalStockCount += quantity;
      });
    } catch (inventoryError) {
      console.error(
        "Raktár adatok lekérdezési hiba:",
        inventoryError
      );
    }

    /*
     * A kiválasztott évekhez külön dátumtartományokat
     * készítünk.
     *
     * Példa:
     * 2024.01.01 - 2025.01.01
     * 2025.01.01 - 2026.01.01
     */
    const selectedYearRanges = safeSelectedYears.map(
      (year) => ({
        createdAt: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      })
    );

    /*
     * Csak az elfogadott ajánlatok tételeit kérjük le,
     * és csak a kiválasztott évekből.
     */
    const selectedItems =
      await prisma.quoteItem.findMany({
        where: {
          quote: {
            status: "accepted",
            OR: selectedYearRanges,
          },
        },
        include: {
          quote: true,
        },
      });

    const calculateTotals = (items: any[]) => {
      let gross = 0;
      let totalCostGross = 0;

      items.forEach((item) => {
        const quantity = Number(
          item.quantity || 0
        );

        const costNet = Number(
          item.costNet || 0
        );

        const lineGross = Number(
          item.lineGross || 0
        );

        gross += lineGross;

        const costGross =
          quantity * costNet * 1.27;

        totalCostGross += costGross;
      });

      const profit = gross - totalCostGross;

      const margin =
        gross > 0
          ? Math.round((profit / gross) * 100)
          : 0;

      return {
        gross: Math.round(gross),
        profit: Math.round(profit),
        margin,
      };
    };

    /*
     * Évenkénti külön bontás.
     *
     * Így a frontend nemcsak összevont adatokat,
     * hanem minden kiválasztott év külön eredményét
     * is meg tudja jeleníteni.
     */
    const yearlyBreakdown =
      safeSelectedYears.map((year) => {
        const itemsForYear =
          selectedItems.filter((item) => {
            return (
              new Date(
                item.quote.createdAt
              ).getFullYear() === year
            );
          });

        const totals =
          calculateTotals(itemsForYear);

        const quoteIds = new Set(
          itemsForYear.map(
            (item) => item.quoteId
          )
        );

        return {
          year,
          ...totals,
          count: quoteIds.size,
        };
      });

    /*
     * A kiválasztott évek összevont eredménye.
     */
    const combinedStats =
      calculateTotals(selectedItems);

    const selectedQuoteCount =
      await prisma.quote.count({
        where: {
          status: "accepted",
          OR: selectedYearRanges,
        },
      });

    /*
     * Aktuális havi statisztika.
     *
     * Ez továbbra is kizárólag az aktuális hónapot
     * és az aktuális évet mutatja.
     */
    const firstDayOfCurrentMonth = new Date(
      currentYear,
      today.getMonth(),
      1
    );

    const firstDayOfNextMonth = new Date(
      currentYear,
      today.getMonth() + 1,
      1
    );

    const monthlyItems =
      await prisma.quoteItem.findMany({
        where: {
          quote: {
            status: "accepted",
            createdAt: {
              gte: firstDayOfCurrentMonth,
              lt: firstDayOfNextMonth,
            },
          },
        },
        include: {
          quote: true,
        },
      });

    const monthlyStats =
      calculateTotals(monthlyItems);

    const monthlyQuoteCount =
      await prisma.quote.count({
        where: {
          status: "accepted",
          createdAt: {
            gte: firstDayOfCurrentMonth,
            lt: firstDayOfNextMonth,
          },
        },
      });

    return NextResponse.json({
      selectedYears: safeSelectedYears,
      availableYears,

      totalClients,
      totalUnits: units.length,
      urgentCount,

      inventory: {
        totalValue: Math.round(
          inventoryTotalValue
        ),
        totalItemsCount,
        totalStockCount: Math.round(
          totalStockCount
        ),
      },

      monthly: {
        ...monthlyStats,
        count: monthlyQuoteCount,
        year: currentYear,
        month: today.getMonth() + 1,
      },

      yearly: {
        ...combinedStats,
        count: selectedQuoteCount,
      },

      yearlyBreakdown,
    });
  } catch (error: any) {
    console.error("Stats API Error:", error);

    return NextResponse.json(
      {
        error:
          "Hiba a statisztika lekérésekor",
        details:
          error?.message ||
          "Ismeretlen szerverhiba",
      },
      {
        status: 500,
      }
    );
  }
}
