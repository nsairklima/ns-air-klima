import { prisma } from "@/lib/prisma";

// GET /api/maintenance/:id – egy karbantartás lekérése
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const item = await prisma.maintenanceLog.findUnique({
      where: { id: Number(params.id) },
      include: {
        unit: {
          include: { client: true }
        }
      }
    });

    if (!item) {
      return Response.json({ error: "Karbantartás nem található." }, { status: 404 });
    }

    return Response.json(item);
  } catch (error) {
    return Response.json(
      { error: "Hiba történt a karbantartás lekérésekor." },
      { status: 500 }
    );
  }
}

// PUT /api/maintenance/:id – módosítás
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await req.json();

    const updated = await prisma.maintenanceLog.update({
      where: { id: Number(params.id) },
      data: {
        description: data.description,
        materials: data.materials,
        costInternal: data.costInternal,
        photos: data.photos
      }
    });

    return Response.json(updated);
  } catch (error) {
    return Response.json(
      { error: "Hiba történt a karbantartás módosításakor." },
      { status: 500 }
    );
  }
}

// DELETE /api/maintenance/:id – törlés
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.maintenanceLog.delete({
      where: { id: Number(params.id) }
    });

    return Response.json({ message: "Karbantartás törölve." });
  } catch (error) {
    return Response.json(
      { error: "Hiba történt a karbantartás törlésekor." },
      { status: 500 }
    );
  }
}
