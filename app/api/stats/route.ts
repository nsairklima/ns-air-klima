import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);

    // 1. ÜGYFÉL ÉS GÉP STATISZTIKÁK
    const totalClients = await prisma.client.count();
    const units = await prisma.clientUnit.findMany({
      include: {
        maintenance: {
          orderBy: { performedDate: "desc" },
          take: 1
        }
      }
    });

    const urgentCount = units.filter(unit => {
      if (unit.maintenance.length === 0) return true;
      const lastDate = new Date(unit.maintenance[0].performedDate);
      const diffDays = Math.ceil(Math.abs(today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 330;
    }).length;

    // 2. RAKTÁRKÉSZLET STATISZTIKA (Benne álló összeg kiszámítása)
    // Feltételezve, hogy a Prisma modell neve 'material' vagy 'item' (itt 'material'-ként hivatkozunk rá)
    // Ha a sémádban más a neve (pl. prisma.item), csak írd át azt a sort.
    const materials = await prisma.material.findMany();

    let inventoryTotalValue = 0;
    let totalStockCount = 0;

    materials.forEach((mat: any) => {
      // Mennyiség és ár beolvasása (biztonságos szám átalakítással)
      const quantity = Number(mat.quantity || mat.stock || 0);
      const price = Number(mat.netPrice || mat.price || mat.costNet || 0);

      inventoryTotalValue += quantity * price;
      totalStockCount += quantity;
    });

    // 3. PÉNZÜGYI STATISZTIKÁK LEKÉRÉSE (Év elejétől kezdve)
    const yearlyItems = await prisma.quoteItem.findMany({
      where: {
        quote: {
          createdAt: { gte: firstDayOfYear }
        }
      },
      include: {
        quote: true
      }
    });

    // Segédfüggvény az összesítéshez
    const calculateTotals = (items: any[]) => {
      let gross = 0;
      let totalCostBrutto = 0;

      items.forEach(item => {
        gross += Number(item.lineGross || 0);
        const costBrutto = (Number(item.quantity || 0) * Number(item.costNet || 0)) * 1.27;
        totalCostBrutto += costBrutto;
      });

      const profit = gross - totalCostBrutto;
      const margin = gross > 0 ? Math.round((profit / gross) * 100) : 0;

      return {
        gross: Math.round(gross),
        profit: Math.round(profit),
        margin
      };
    };

    // Havi vs Éves szétválogatás
    const monthlyItems = yearlyItems.filter(item => new Date(item.quote.createdAt) >= firstDayOfMonth);

    const monthlyStats = calculateTotals(monthlyItems);
    const yearlyStats = calculateTotals(yearlyItems);

    // Ajánlatok száma
    const monthlyQuoteCount = await prisma.quote.count({
      where: { createdAt: { gte: firstDayOfMonth } }
    });
    const yearlyQuoteCount = await prisma.quote.count({
      where: { createdAt: { gte: firstDayOfYear } }
    });

    // 4. VÁLASZ ÖSSZEÁLLÍTÁSA
    return NextResponse.json({
      // Alapadatok
      totalClients,
      totalUnits: units.length,
      urgentCount,

      // Raktár adatok
      inventory: {
        totalValue: Math.round(inventoryTotalValue),
        totalItemsCount: materials.length,
        totalStockCount: Math.round(totalStockCount)
      },

      // Havi bontás
      monthly: {
        ...monthlyStats,
        count: monthlyQuoteCount
      },

      // Éves bontás
      yearly: {
        ...yearlyStats,
        count: yearlyQuoteCount
      }
    });

  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json({ error: "Hiba a statisztika lekérésekor" }, { status: 500 });
  }
}
