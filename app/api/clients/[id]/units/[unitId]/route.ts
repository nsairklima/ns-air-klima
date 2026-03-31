import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GÉP TÖRLÉSE
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; unitId: string } }
) {
  try {
    const unitId = parseInt(params.unitId);

    // 1. Töröljük a kapcsolódó karbantartási naplókat (MaintenanceLog)
    await prisma.maintenanceLog.deleteMany({
      where: { unitId: unitId },
    });

    // 2. Töröljük a kapcsolódó email értesítéseket
    await prisma.emailNotifications.deleteMany({
      where: { clientUnitId: unitId },
    });

    // 3. Most már törölhető a gép (clientUnit)
    await prisma.clientUnit.delete({
      where: { id: unitId },
    });

    return NextResponse.json({ message: "Gép és kapcsolódó adatok törölve." });
  } catch (error) {
    console.error("Törlési hiba:", error);
    return NextResponse.json({ error: "Sikertelen törlés" }, { status: 500 });
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

    // Itt frissítjük a ClientUnit táblát
    const updatedUnit = await prisma.clientUnit.update({
      where: { id: unitId },
      data: {
        brand: data.brand,
        model: data.model,
        serialNumber: data.serialNumber,
        location: data.location,
        // Ha jön dátum, Date objektummá alakítjuk, ha nem, marad null
        installation: data.installation ? new Date(data.installation) : null,
      },
    });

    return NextResponse.json(updatedUnit);
  } catch (error) {
    console.error("Módosítási hiba az API-ban:", error);
    return NextResponse.json({ error: "Sikertelen frissítés az adatbázisban." }, { status: 500 });
  }
}
