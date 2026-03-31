import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GÉP ADATAINAK LEKÉRÉSE + NAPLÓK
export async function GET(
  req: Request,
  { params }: { params: { unitId: string } }
) {
  try {
    const unitId = parseInt(params.unitId);
    
    const unit = await prisma.clientUnit.findUnique({
      where: { id: unitId },
      include: {
        // Ellenőrizd a schema.prisma-ban: ha a kapcsolat neve 'maintenanceLog', 
        // akkor azt írd ide. Ha 'maintenance', akkor maradhat ez.
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
  { params }: { params: { unitId: string } }
) {
  try {
    const data = await req.json();
    const unitId = parseInt(params.unitId);

    const updated = await prisma.clientUnit.update({
      where: { id: unitId },
      data: {
        brand: data.brand,
        model: data.model,
        serialNumber: data.serialNumber,
        location: data.location,
        status: data.status,
        // Biztosítjuk, hogy a dátum Date objektum legyen vagy maradjon null
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
  { params }: { params: { unitId: string } }
) {
  try {
    const id = parseInt(params.unitId);
    
    // 1. Töröljük a naplókat (kényszerített törlés a kapcsolat miatt)
    await prisma.maintenanceLog.deleteMany({ 
      where: { unitId: id } 
    });
    
    // 2. Töröljük magát a gépet
    await prisma.clientUnit.delete({ 
      where: { id: id } 
    });

    return NextResponse.json({ message: "Gép és naplói törölve" });
  } catch (error) {
    console.error("DELETE hiba:", error);
    return NextResponse.json({ error: "Hiba a törléskor" }, { status: 500 });
  }
}
