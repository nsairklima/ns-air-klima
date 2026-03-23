import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const totalClients = await prisma.client.count();
    const totalUnits = await prisma.clientUnit.count();
    
    // Lekérjük a gépeket, hogy a szerver oldalon számoljuk ki a sürgőseket
    const units = await prisma.clientUnit.findMany({
      include: {
        maintenance: {
          orderBy: { performedDate: "desc" },
          take: 1
        }
      }
    });

    const today = new Date();
    const urgentCount = units.filter(unit => {
      if (unit.maintenance.length === 0) return true; // Soha nem volt karbantartva
      const lastDate = new Date(unit.maintenance[0].performedDate);
      const diffDays = Math.ceil(Math.abs(today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 330; // 11 hónapnál régebbi
    }).length;

    return NextResponse.json({
      totalClients,
      totalUnits,
      urgentCount
    });
  } catch (error) {
    return NextResponse.json({ error: "Hiba a statisztika lekérésekor" }, { status: 500 });
  }
}
