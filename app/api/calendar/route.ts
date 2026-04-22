import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// --- LEKÉRÉS (GET) ---
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
      unitId: m.unitId, // Szükséges a szerkesztéshez
      date: m.performedDate ? new Date(m.performedDate).toISOString().split('T')[0] : null,
      title: `${m.unit.client.name} - ${m.unit.brand} ${m.unit.model}`,
      description: m.description || "Karbantartás",
      status: "COMPLETED" 
    })).filter(e => e.date !== null);

    return NextResponse.json(events);
  } catch (error) {
    console.error("Calendar API GET Error:", error);
    return NextResponse.json({ error: "Hiba az adatok lekérésekor" }, { status: 500 });
  }
}

// --- LÉTREHOZÁS (POST) ---
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { unitId, performedDate, description } = body;

    if (!unitId || !performedDate) {
      return NextResponse.json({ error: "Hiányzó adatok" }, { status: 400 });
    }

    const newLog = await prisma.maintenanceLog.create({
      data: {
        unitId: parseInt(unitId),
        performedDate: new Date(performedDate),
        description: description || "Manuálisan felvitt karbantartás",
      }
    });

    return NextResponse.json(newLog);
  } catch (error) {
    console.error("Calendar API POST Error:", error);
    return NextResponse.json({ error: "Hiba a mentés során" }, { status: 500 });
  }
}

// --- SZERKESZTÉS (PUT) ---
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, description, performedDate } = body;

    if (!id) return NextResponse.json({ error: "Hiányzó azonosító" }, { status: 400 });

    const updatedLog = await prisma.maintenanceLog.update({
      where: { id: parseInt(id) },
      data: {
        description: description,
        performedDate: new Date(performedDate),
      },
    });

    return NextResponse.json(updatedLog);
  } catch (error) {
    console.error("Calendar API PUT Error:", error);
    return NextResponse.json({ error: "Hiba a szerkesztés során" }, { status: 500 });
  }
}

// --- TÖRLÉS (DELETE) ---
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Hiányzó azonosító" }, { status: 400 });

    await prisma.maintenanceLog.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Calendar API DELETE Error:", error);
    return NextResponse.json({ error: "Hiba a törlés során" }, { status: 500 });
  }
}
