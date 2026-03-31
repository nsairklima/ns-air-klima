import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GÉP TÖRLÉSE
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; unitId: string } }
) {
  try {
    const unitId = parseInt(params.unitId);

    await prisma.unit.delete({
      where: { id: unitId },
    });

    return NextResponse.json({ message: "Gép sikeresen törölve" });
  } catch (error) {
    console.error("Hiba a törléskor:", error);
    return NextResponse.json({ error: "Sikertelen törlés" }, { status: 500 });
  }
}

// GÉP MÓDOSÍTÁSA (PATCH) - Ez is kellhet a szerkesztéshez
export async function PATCH(
  req: Request,
  { params }: { params: { unitId: string } }
) {
  try {
    const data = await req.json();
    const unitId = parseInt(params.unitId);

    const updatedUnit = await prisma.unit.update({
      where: { id: unitId },
      data: {
        brand: data.brand,
        model: data.model,
        serialNumber: data.serialNumber,
        location: data.location,
        status: data.status,
        installation: data.installation ? new Date(data.installation) : undefined,
      },
    });

    return NextResponse.json(updatedUnit);
  } catch (error) {
    return NextResponse.json({ error: "Sikertelen frissítés" }, { status: 500 });
  }
}
