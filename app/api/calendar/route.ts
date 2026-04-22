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
      }
    });

    const events = maintenances.map(m => ({
      id: m.id,
      unitId: m.unitId,
      date: m.performedDate ? new Date(m.performedDate).toISOString().split('T')[0] : null,
      title: `${m.unit.client.name} - ${m.unit.brand} ${m.unit.model}`,
      description: m.description || "Karbantartás",
      status: "COMPLETED" 
    })).filter(e => e.date !== null);

    return NextResponse.json(events);
  } catch (error) {
    return NextResponse.json({ error: "Hiba az adatok lekérésekor" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { unitId, performedDate, description } = body;
    const newLog = await prisma.maintenanceLog.create({
      data: {
        unitId: parseInt(unitId),
        performedDate: new Date(performedDate),
        description: description || "",
      }
    });
    return NextResponse.json(newLog);
  } catch (error) {
    return NextResponse.json({ error: "Hiba" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, description, performedDate } = body;
    const updatedLog = await prisma.maintenanceLog.update({
      where: { id: parseInt(id) },
      data: {
        description: description,
        performedDate: new Date(performedDate),
      },
    });
    return NextResponse.json(updatedLog);
  } catch (error) {
    return NextResponse.json({ error: "Hiba" }, { status: 500 });
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
    return NextResponse.json({ error: "Hiba" }, { status: 500 });
  }
}
