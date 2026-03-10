import { prisma } from "@/lib/prisma";

// GET /api/client-units/:unitId – egy klíma adatainak lekérése
export async function GET(
  req: Request,
  { params }: { params: { unitId: string } }
) {
  try {
    const unit = await prisma.clientUnit.findUnique({
      where: { id: Number(params.unitId) },
      include: {
        client: true,
        maintenance: true
      }
    });

    if (!unit) {
      return Response.json({ error: "A klíma nem található." }, { status: 404 });
    }

    return Response.json(unit);
  } catch (error) {
    return Response.json(
      { error: "Hiba történt a klíma adatainak lekérésekor." },
      { status: 500 }
    );
  }
}

// PUT /api/client-units/:unitId – klíma módosítása
export async function PUT(
  req: Request,
  { params }: { params: { unitId: string } }
) {
  try {
    const data = await req.json();

    const updated = await prisma.clientUnit.update({
      where: { id: Number(params.unitId) },
      data: {
        brand: data.brand,
        model: data.model,
        powerKw: data.powerKw,
        serialNumber: data.serialNumber,
        installation: data.installation ? new Date(data.installation) : null,
        periodMonths: data.periodMonths,
        location: data.location,
        notes: data.notes
      }
    });

    return Response.json(updated);
  } catch (error) {
    return Response.json(
      { error: "Hiba történt a klíma módosításakor." },
      { status: 500 }
    );
  }
}

// DELETE /api/client-units/:unitId – klíma törlése
export async function DELETE(
  req: Request,
  { params }: { params: { unitId: string } }
) {
  try {
    await prisma.clientUnit.delete({
      where: { id: Number(params.unitId) }
    });

    return Response.json({ message: "Klíma törölve." });
  } catch (error) {
    return Response.json(
      { error: "Hiba történt a klíma törlésekor." },
      { status: 500 }
    );
  }
}
