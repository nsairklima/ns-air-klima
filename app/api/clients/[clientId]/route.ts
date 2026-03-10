import { prisma } from "@/lib/prisma";

// GET /api/clients/:clientId – egy ügyfél adatai
export async function GET(
  req: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: Number(params.clientId) }
    });

    if (!client) {
      return Response.json({ error: "Ügyfél nem található." }, { status: 404 });
    }

    return Response.json(client);
  } catch (error) {
    return Response.json({ error: "Hiba az ügyfél lekérésekor." }, { status: 500 });
  }
}

// PUT /api/clients/:clientId – ügyfél módosítása
export async function PUT(
  req: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const data = await req.json();

    const updated = await prisma.client.update({
      where: { id: Number(params.clientId) },
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        notes: data.notes
      }
    });

    return Response.json(updated);
  } catch (error) {
    return Response.json({ error: "Hiba ügyfél módosításakor." }, { status: 500 });
  }
}

// DELETE /api/clients/:clientId – törlés
export async function DELETE(
  req: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    await prisma.client.delete({
      where: { id: Number(params.clientId) }
    });

    return Response.json({ message: "Ügyfél törölve." });
  } catch (error) {
    return Response.json({ error: "Hiba ügyfél törlésekor." }, { status: 500 });
  }
}
``
