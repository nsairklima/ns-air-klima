import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. MEGLÉVŐ SZERVIZNAPLÓK LEKÉRÉSE (Múltbeli / Elvégzett munkák)
    const maintenances = await prisma.maintenanceLog.findMany({
      include: {
        unit: {
          include: {
            client: true
          }
        }
      },
      orderBy: { performedDate: 'asc' }
    });

    const pastEvents = maintenances.map(m => ({
      id: `log-${m.id}`,
      unitId: m.unitId,
      date: m.performedDate ? m.performedDate.toISOString() : null,
      title: `${m.unit?.client?.name || "Ügyfél"} - ${m.unit?.brand || ""} ${m.unit?.model || ""}`,
      description: m.description || "",
      type: m.type || "MAINTENANCE",
      unit: m.unit 
    })).filter(e => e.date !== null);

    // 2. AUTOMATIKUS JÖVŐBELI TERVEZÉS (Telepítés vagy legutolsó szerviz alapján)
    // A séma szerint a táblád: clientUnit, a logok kapcsolat neve pedig: maintenance
    const units = await prisma.clientUnit.findMany({
      include: {
        client: true,
        maintenance: {
          orderBy: { performedDate: 'desc' },
          take: 1 // Csak a legfrissebb elvégzett szerviz kell nekünk
        }
      }
    });

    const plannedEvents: any[] = [];

    units.forEach(u => {
      const lastLog = u.maintenance?.[0];
      // HA volt már szerviz, akkor abból számolunk. HA még nem volt, akkor a TELEPÍTÉS (installation) dátumából!
      const baseDate = lastLog?.performedDate || u.installation;

      if (baseDate) {
        const nextMaintenanceDate = new Date(baseDate);
        
        // A sémád szerinti ciklusidő (hónapokban), alapértelmezetten 12 hónap
        const monthsToAdd = u.periodMonths ?? 12;
        nextMaintenanceDate.setMonth(nextMaintenanceDate.getMonth() + monthsToAdd);

        plannedEvents.push({
          id: `planned-${u.id}`,
          unitId: u.id,
          date: nextMaintenanceDate.toISOString(),
          title: `⚠️ KÖV. KARBANTARTÁS: ${u.client?.name || "Ügyfél"}`,
          description: `Gép: ${u.brand} ${u.model}\nUtolsó esemény alapja: ${new Date(baseDate).toLocaleDateString('hu-HU')}`,
          type: "PLANNED", // A frontend naptáradban sárga vagy eltérő színnel jelölhető
          unit: u
        });
      }
    });

    // Összefésüljük a múltbeli naplókat és a kiszámolt jövőbeli időpontokat
    return NextResponse.json([...pastEvents, ...plannedEvents]);

  } catch (error) {
    console.error("Naptár GET hiba:", error);
    return NextResponse.json({ error: "Hiba az adatok lekérésekor" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { unitId, performedDate, description, type } = body; 
    
    const newLog = await prisma.maintenanceLog.create({
      data: {
        unitId: parseInt(unitId),
        performedDate: new Date(performedDate),
        description: description || "",
        type: type || "MAINTENANCE", 
      },
      include: { unit: { include: { client: true } } }
    });
    return NextResponse.json(newLog);
  } catch (error) {
    console.error("POST hiba:", error);
    return NextResponse.json({ error: "Mentési hiba" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, description, performedDate, type } = body; 
    
    const updatedLog = await prisma.maintenanceLog.update({
      where: { id: parseInt(id) },
      data: {
        description: description,
        performedDate: new Date(performedDate),
        type: type, 
      },
    });
    return NextResponse.json(updatedLog);
  } catch (error) {
    console.error("PUT hiba:", error);
    return NextResponse.json({ error: "Módosítási hiba" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Nincs ID" }, { status: 400 });
    
    await prisma.maintenanceLog.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE hiba:", error);
    return NextResponse.json({ error: "Törlési hiba" }, { status: 500 });
  }
}
