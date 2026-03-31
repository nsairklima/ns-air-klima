import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GÉP ADATAINAK LEKÉRÉSE (Ez hiányzott a 405-ös hiba alapján!)
export async function GET(
  req: Request,
  { params }: { params: { unitId: string } }
) {
  try {
    const unit = await prisma.clientUnit.findUnique({
      where: { id: parseInt(params.unitId) },
      include: {
        maintenance: true, // Beemeljük a karbantartási naplókat is!
      },
    });

    if (!unit) {
      return NextResponse.json({ error: "Gép nem található" }, { status: 404 });
    }

    return NextResponse.json(unit);
  } catch (error) {
    return NextResponse.json({ error: "Hiba a lekérés során" }, { status: 500 });
  }
}

// A többi metódus (PATCH, DELETE) maradhat alatta...
export async function PATCH(req: Request, { params }: { params: { unitId: string } }) {
  try {
    const data = await req.json();
    const updated = await prisma.clientUnit.update({
      where: { id: parseInt(params.unitId) },
      data: {
        brand: data.brand,
        model: data.model,
        serialNumber: data.serialNumber,
        location: data.location,
        status: data.status,
        installation: data.installation ? new Date(data.installation) : undefined,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Hiba a frissítéskor" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { unitId: string } }) {
  try {
    const id = parseInt(params.unitId);
    await prisma.maintenanceLog.deleteMany({ where: { unitId: id } });
    await prisma.clientUnit.delete({ where: { id } });
    return NextResponse.json({ message: "Törölve" });
  } catch (error) {
    return NextResponse.json({ error: "Hiba a törléskor" }, { status: 500 });
  }
}
