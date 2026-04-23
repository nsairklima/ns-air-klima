import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
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

    const events = maintenances.map(m => ({
      id: m.id,
      unitId: m.unitId,
      date: m.performedDate ? m.performedDate.toISOString() : null,
      // Meghagyjuk a title-t is a biztonság kedvéért
      title: `${m.unit.client.name} - ${m.unit.brand} ${m.unit.model}`,
      description: m.description || "",
      type: m.type || "MAINTENANCE",
      // Visszaküldjük a teljes unitot, hogy a frontend elérje: ev.unit.client.name
      unit: m.unit 
    })).filter(e => e.date !== null);

    return NextResponse.json(events);
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
