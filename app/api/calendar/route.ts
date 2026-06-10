import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. A már elvégzett szerviznaplók lekérése
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
      title: `${m.unit.client.name} - ${m.unit.brand} ${m.unit.model}`,
      description: m.description || "",
      type: m.type || "MAINTENANCE",
      unit: m.unit 
    })).filter(e => e.date !== null);

    // 2. JÖVŐBELI KISZÁMÍTÁS: A pontos clientUnit táblát kérjük le!
    const units = await prisma.clientUnit.findMany({
      include: {
        client: true,
        maintenanceLogs: {
          orderBy: { performedDate: 'desc' },
          take: 1 // Csak a legfrissebb szerviznapló kell
        }
      }
    });

    const plannedEvents: any[] = [];

    units.forEach(u => {
      // HA volt már szerviz, az az alap. HA még nem volt, akkor a TELEPÍTÉS dátuma!
      const lastLog = u.maintenanceLogs[0];
      const baseDate = lastLog?.performedDate || u.installation;

      if (baseDate) {
        const nextMaintenanceDate = new Date(baseDate);
        
        // Ciklusidő (Hónapok száma). Ha a sémádban nincs elmentve, alapértelmezetten 12 hónap (1 év)
        const periodMonths = (u as any).periodMonths || 12; 
        nextMaintenanceDate.setMonth(nextMaintenanceDate.getMonth() + periodMonths);

        plannedEvents.push({
          id: `planned-${u.id}`,
          unitId: u.id,
          date: nextMaintenanceDate.toISOString(),
          title: `⚠️ KÖV. KARBANTARTÁS: ${u.client.name}`,
          description: `Gép: ${u.brand} ${u.model}\nUtolsó esemény alapja: ${new Date(baseDate).toLocaleDateString('hu-HU')}`,
          type: "PLANNED", 
          unit: u
        });
      }
    });

    return NextResponse.json([...pastEvents, ...plannedEvents]);
  } catch (error) {
    console.error("GET hiba:", error);
    return NextResponse.json({ error: "Hiba az adatok lekérésekor" }, { status: 500 });
  }
}

// A POST, PUT, DELETE metódusok maradhatnak a régiek...
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
  } catch (error) { return NextResponse.json({ error: "Mentési hiba" }, { status: 500 }); }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, description, performedDate, type } = body; 
    const updatedLog = await prisma.maintenanceLog.update({
      where: { id: parseInt(id) },
      data: { description, performedDate: new Date(performedDate), type },
    });
    return NextResponse.json(updatedLog);
  } catch (error) { return NextResponse.json({ error: "Módosítási hiba" }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Nincs ID" }, { status: 400 });
    await prisma.maintenanceLog.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) { return NextResponse.json({ error: "Törlési hiba" }, { status: 500 }); }
}
