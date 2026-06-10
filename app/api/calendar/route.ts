import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Lekérjük a már elvégzett karbantartások naplóit (MÚLT/JELEN)
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

    // Átalakítjuk a meglévő naplókat naptár eseményekké
    const pastEvents = maintenances.map(m => ({
      id: `log-${m.id}`,
      unitId: m.unitId,
      date: m.performedDate ? m.performedDate.toISOString() : null,
      title: `${m.unit.client.name} - ${m.unit.brand} ${m.unit.model}`,
      description: m.description || "",
      type: m.type || "MAINTENANCE", // pl. elvégzett karbantartás
      unit: m.unit 
    })).filter(e => e.date !== null);

    // 2. Lekérjük az ÖSSZES GÉPET a legfrissebb naplójukkal együtt (JÖVŐBELI TERVEZÉS)
    const units = await prisma.unit.findMany({
      include: {
        client: true,
        maintenanceLogs: {
          orderBy: { performedDate: 'desc' },
          take: 1 // Csak a legutolsó elvégzett szerviz kell a számításhoz
        }
      }
    });

    const plannedEvents: any[] = [];

    units.forEach(u => {
      // Megnézzük, van-e utolsó szerviz, ha nincs, a telepítési dátumot vesszük alapul (FALLBACK)
      const lastLog = u.maintenanceLogs[0];
      const baseDate = lastLog?.performedDate || u.installation;

      // Csak akkor számolunk jövőbeli alkalmat, ha van kiindulási alapunk (vagy telepítve van, vagy volt már szervizelve)
      if (baseDate) {
        const nextMaintenanceDate = new Date(baseDate);
        
        // Hozzáadjuk a karbantartási ciklust (ha nincs megadva a gépnél a periodMonths, alapértelmezetten 12 hónap)
        const periodMonths = (u as any).periodMonths || 12; 
        nextMaintenanceDate.setMonth(nextMaintenanceDate.getMonth() + periodMonths);

        plannedEvents.push({
          id: `planned-${u.id}`,
          unitId: u.id,
          date: nextMaintenanceDate.toISOString(),
          title: `⚠️ KÖV. KARBANTARTÁS: ${u.client.name}`,
          description: `Gyártó/Modell: ${u.brand} ${u.model}\nUtolsó esemény alapja: ${new Date(baseDate).toLocaleDateString('hu-HU')}`,
          type: "PLANNED", // Szuperül különválasztható a frontend naptárban (pl. sárga színnel)
          unit: u
        });
      }
    });

    // Összefésüljük a múltbeli elvégzett naplókat és a jövőbeli tervezett időpontokat
    const allEvents = [...pastEvents, ...plannedEvents];

    return NextResponse.json(allEvents);
  } catch (error) {
    console.error("GET hiba:", error);
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
