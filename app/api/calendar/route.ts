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

    // 2. ÖSSZES GÉP LEKÉRÉSE A TELEPÍTÉSEKHEZ ÉS TERVEZÉSHEZ
    const units = await prisma.clientUnit.findMany({
      include: {
        client: true,
        maintenance: {
          orderBy: { performedDate: 'desc' },
          take: 1 // Csak a legfrissebb elvégzett szerviz kell
        }
      }
    });

    const installationEvents: any[] = [];
    const plannedEvents: any[] = [];
    const now = new Date();

    units.forEach(u => {
      // 2/A. TÉNYLEGES TELEPÍTÉSI ESEMÉNY A NAPTÁRBA (Zöld színnel)
      if (u.installedAt) {
  installationEvents.push({
    id: `install-${u.id}`,
    unitId: u.id,
    date: new Date(u.installedAt).toISOString(),
    title: `✅ TELEPÍTVE: ${u.client?.name || "Ügyfél"}`,
    description: `Gép: ${u.brand} ${u.model}\nCím: ${u.client?.address || "-"}`,
    type: "INSTALLATION",
    unit: u
  });
}

      if (u.installation && !u.installedAt) {
  plannedEvents.push({
    id: `planned-install-${u.id}`,
    unitId: u.id,
    date: new Date(u.installation).toISOString(),
    title: `⏳ TERVEZETT TELEPÍTÉS: ${u.client?.name || "Ügyfél"}`,
    description: `${u.brand} ${u.model}`,
    type: "PLANNED_INSTALLATION",
    unit: u
  });
}

      // 2/B. AUTOMATIKUS JÖVŐBELI TERVEZÉS (vagy elmaradt karbantartás)
      const lastLog = u.maintenance?.[0];
      // Ha volt már szerviz, abból számolunk. Ha nem, a TELEPÍTÉS dátumából!
      const baseDate =
  lastLog?.performedDate ||
  u.installedAt;

      if (baseDate) {
        const nextMaintenanceDate = new Date(baseDate);
        const monthsToAdd = u.periodMonths ?? 12;
        nextMaintenanceDate.setMonth(nextMaintenanceDate.getMonth() + monthsToAdd);

        const isOverdue = nextMaintenanceDate < now;
        const eventType = isOverdue ? "OVERDUE" : "PLANNED";
        const titlePrefix = isOverdue ? "🚨 ELMARADT KARBANTARTÁS" : "⚠️ KÖV. KARBANTARTÁS";

        plannedEvents.push({
          id: `${eventType.toLowerCase()}-${u.id}`,
          unitId: u.id,
          date: nextMaintenanceDate.toISOString(),
          title: `${titlePrefix}: ${u.client?.name || "Ügyfél"}`,
          description: `Gép: ${u.brand} ${u.model}\nUtolsó esemény alapja: ${new Date(baseDate).toLocaleDateString('hu-HU')}`,
          type: eventType,
          unit: u
        });
      }
    });

    // Összefésüljük: Naplózott események + Telepítések + Tervezett/Elmaradt karbantartások
    return NextResponse.json([...pastEvents, ...installationEvents, ...plannedEvents]);

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
