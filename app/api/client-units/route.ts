import { prisma } from "@/lib/prisma";

// GET /api/client-units?clientId=123 – klímák listázása (opcionális szűrés)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientIdParam = searchParams.get("clientId");

    const where = clientIdParam
      ? { clientId: Number(clientIdParam) }
      : undefined;

    const units = await prisma.clientUnit.findMany({
      where,
      include: { client: true },
      orderBy: { id: "desc" },
    });

    return Response.json(units);
  } catch (error) {
    return Response.json(
      { error: "Hiba történt a klímák lekérdezésekor." },
      { status: 500 }
    );
  }
}

// POST /api/client-units – új klíma felvétele
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const created = await prisma.clientUnit.create({
      data: {
        clientId: Number(data.clientId),
        brand: data.brand,
        model: data.model,
        powerKw: data.powerKw ? Number(data.powerKw) : null,
        serialNumber: data.serialNumber || null,
        installation: data.installation ? new Date(data.installation) : null,
        periodMonths: data.periodMonths ? Number(data.periodMonths) : 12,
        location: data.location || null,
        notes: data.notes || null,
      },
    });
    return Response.json(created);
  } catch (error) {
    return Response.json(
      { error: "Hiba történt klíma létrehozásakor." },
      { status: 500 }
    );
  }
}
``
