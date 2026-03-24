import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string; unitId: string } }
) {
  try {
    const unit = await prisma.clientUnit.findUnique({
      where: { id: Number(params.unitId) },
      include: {
        maintenance: {
          orderBy: { performedDate: "desc" }
        }
      }
    });

    if (!unit) return NextResponse.json({ error: "Gép nem található" }, { status: 404 });

    return NextResponse.json(unit);
  } catch (error) {
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; unitId: string } }
) {
  try {
    const body = await req.json();
    const unitId = Number(params.unitId);

    if (isNaN(unitId)) {
      return NextResponse.json({ error: "Érvénytelen ID" }, { status: 400 });
    }

    // MEZŐK TISZTÍTÁSA: Csak azokat a mezőket küldjük a Prismának, amik kellenek.
    // Ez megakadályozza, hogy extra mezők (pl. id, clientId) miatt 500-as hiba legyen.
    const updateData: any = {};
    if (body.brand) updateData.brand = body.brand;
    if (body.model) updateData.model = body.model;
    if (body.serialNumber) updateData.serialNumber = body.serialNumber;
    if (body.location) updateData.location = body.location;
    if (body.status) updateData.status = body.status; // Ez a gomb lelke!

    const updatedUnit = await prisma.clientUnit.update({
      where: { id: unitId },
      data: updateData,
    });

    return NextResponse.json(updatedUnit);
  } catch (error: any) {
    console.error("RÉSZLETES HIBA:", error);
    return NextResponse.json(
      { error: "Mentési hiba: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; unitId: string } }
) {
  try {
    await prisma.clientUnit.delete({
      where: { id: Number(params.unitId) },
    });
    return NextResponse.json({ message: "Gép törölve" });
  } catch (error) {
    return NextResponse.json({ error: "Hiba a törléskor" }, { status: 500 });
  }
}
