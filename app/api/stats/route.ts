import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. ÜGYFÉL ÉS GÉP STATISZTIKÁK (Eredeti kódod)
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

    // 2. PÉNZÜGYI STATISZTIKÁK (Új kód az 1-es és 2-es ponthoz)
    // Lekérjük az e havi összes tétel adatot
    const monthlyItems = await prisma.quoteItem.findMany({
      where: {
        quote: {
          createdAt: { gte: firstDayOfMonth }
        }
      }
    });

    let monthlyGross = 0;
    let totalCostNet = 0;

    monthlyItems.forEach(item => {
      monthlyGross += Number(item.lineGross || 0);
      // Költség kiszámítása: (mennyiség * beszerzési nettó) * ÁFA
      const itemCostBrutto = (Number(item.quantity || 0) * Number(item.costNet || 0)) * 1.27;
      totalCostNet += itemCostBrutto;
    });

    const monthlyProfit = monthlyGross - totalCostNet;
    const avgMargin = monthlyGross > 0 ? Math.round((monthlyProfit / monthlyGross) * 100) : 0;

    // Ajánlatok száma ebben a hónapban
    const monthlyQuoteCount = await prisma.quote.count({
      where: {
        createdAt: { gte: firstDayOfMonth }
      }
    });

    // 3. VÁLASZ ÖSSZEÁLLÍTÁSA
    return NextResponse.json({
      // Ügyfél adatok
      totalClients,
      totalUnits: units.length,
      urgentCount,
      // Pénzügyi adatok
      monthlyGross: Math.round(monthlyGross),
      monthlyProfit: Math.round(monthlyProfit),
      avgMargin,
      monthlyQuoteCount
    });

  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json({ error: "Hiba a statisztika lekérésekor" }, { status: 500 });
  }
}
