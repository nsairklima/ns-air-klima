import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GÉP TÖRLÉSE
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; unitId: string } }
) {
  try {
    const unitId = parseInt(params.unitId);

    // 1. ELŐSZÖR töröljük a géphez tartozó összes naplóbejegyzést (ha van)
    // Enélkül az adatbázis "Foreign Key Constraint" hiba miatt megállítana
    await prisma.workLog.deleteMany({
      where: { unitId: unitId },
    });

    // 2. MOST már törölhető maga a gép
    // JAVÍTVA: prisma.Unit (nagybetűvel, ahogy a hibaüzeneted kérte)
    await prisma.unit.delete({
      where: { id: unitId },
    });

    return NextResponse.json({ message: "Gép és naplói sikeresen törölve" });
  } catch (error) {
    console.error("Hiba a törléskor:", error);
    return NextResponse.json({ error: "Sikertelen törlés (adatbázis hiba)" }, { status: 500 });
  }
}

// GÉP MÓDOSÍTÁSA (PATCH)
export async function PATCH(
  req: Request,
  { params }: { params: { unitId: string } }
) {
  try {
    const data = await req.json();
    const unitId = parseInt(params.unitId);

    // JAVÍTVA: prisma.unit használata a sémának megfelelően
    const updatedUnit = await prisma.unit.update({
      where: { id: unitId },
      data: {
        brand: data.brand,
        model: data.model,
        serialNumber: data.serialNumber,
        location: data.location,
        status: data.status,
        // Biztosítjuk, hogy a dátum formátuma megfelelő legyen
        installation: data.installation ? new Date(data.installation) : undefined,
      },
    });

    return NextResponse.json(updatedUnit);
  } catch (error) {
    console.error("Hiba a frissítéskor:", error);
    return NextResponse.json({ error: "Sikertelen frissítés" }, { status: 500 });
  }
}
