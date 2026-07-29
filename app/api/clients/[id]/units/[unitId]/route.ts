import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GÉP ADATAINAK LEKÉRÉSE + NAPLÓK
export async function GET(
  req: Request,
  { params }: { params: Promise<{ unitId: string }> }
) {
  try {
    const resolvedParams = await params;
    const unitId = parseInt(resolvedParams.unitId, 10);

    const unit = await prisma.clientUnit.findUnique({
      where: { id: unitId },
      include: {
        maintenance: true,
      },
    });

    if (!unit) {
      return NextResponse.json({ error: "Gép nem található" }, { status: 404 });
    }

    return NextResponse.json(unit);
  } catch (error) {
    console.error("GET hiba:", error);
    return NextResponse.json({ error: "Hiba a lekérés során" }, { status: 500 });
  }
}

// GÉP ADATAINAK MÓDOSÍTÁSA
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ unitId: string }> }
) {
  try {
    const data = await req.json();
    const resolvedParams = await params;
    const unitId = parseInt(resolvedParams.unitId, 10);

    const updated = await prisma.clientUnit.update({
      where: { id: unitId },
      data: {
        brand: data.brand,
        model: data.model,
        serialNumber: data.serialNumber || null,
        location: data.location || null,
        status: data.status !== undefined ? data.status : undefined,
        installation: data.installation ? new Date(data.installation) : null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH hiba:", error);
    return NextResponse.json({ error: "Hiba a frissítéskor" }, { status: 500 });
  }
}

// GÉP TÖRLÉSE (ÉS A HOZZÁ TARTOZÓ NAPLÓKÉ)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ unitId: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.unitId, 10);

    // 1. Töröljük a naplókat
    await prisma.maintenanceLog.deleteMany({
      where: { unitId: id },
    });

    // 2. Töröljük magát a gépet
    await prisma.clientUnit.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Gép és naplói törölve" });
  } catch (error) {
    console.error("DELETE hiba:", error);
    return NextResponse.json({ error: "Hiba a törléskor" }, { status: 500 });
  }
}
