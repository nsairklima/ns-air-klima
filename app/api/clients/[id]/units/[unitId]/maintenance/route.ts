import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ÚJ KARBANTARTÁS LÉTREHOZÁSA
export async function POST(req: Request, { params }: { params: { unitId: string } }) {
  try {
    const data = await req.json();
    const newLog = await prisma.maintenanceLog.create({
      data: {
        unitId: Number(params.unitId),
        description: data.description,
        performedDate: new Date(data.performedDate),
      },
    });
    return NextResponse.json(newLog);
  } catch (error) {
    return NextResponse.json({ error: "Hiba a mentéskor" }, { status: 500 });
  }
}

// KARBANTARTÁS MÓDOSÍTÁSA (Szerkesztés)
export async function PATCH(req: Request) {
  try {
    const data = await req.json(); // Itt várjuk az id-t, description-t és dátumot
    
    if (!data.id) {
      return NextResponse.json({ error: "Hiányzó azonosító" }, { status: 400 });
    }

    const updatedLog = await prisma.maintenanceLog.update({
      where: { id: Number(data.id) },
      data: {
        description: data.description,
        performedDate: new Date(data.performedDate),
      },
    });

    return NextResponse.json(updatedLog);
  } catch (error) {
    console.error("Update hiba:", error);
    return NextResponse.json({ error: "Hiba a módosításkor" }, { status: 500 });
  }
}

// KARBANTARTÁS TÖRLÉSE
export async function DELETE(req: Request) {
  try {
    // Megpróbáljuk kiolvasni a JSON-t a kérés testéből
    const body = await req.json();
    const id = body.id;

    if (!id) {
      return NextResponse.json({ error: "Nincs megadva törlendő azonosító" }, { status: 400 });
    }

    await prisma.maintenanceLog.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Törlési hiba:", error);
    return NextResponse.json({ error: "Hiba történt a törlés során" }, { status: 500 });
  }
}
