import { prisma } from "@/lib/prisma";

// GET /api/client-units – minden klíma
export async function GET() {
  try {
    const units = await prisma.clientUnit.findMany({
      include: { client: true },
      orderBy: { id: "desc" }
    });

    return Response.json(units);
  } catch (error) {
    return Response.json(
      { error: "Hiba történt a klímák lekérdezésekor." },
      { status: 500 }
    );
  }
}

// POST /api/client-units – új klíma felvétele egy ügyfélhez
export async function POST(req: Request) {
  try {
    const data = await req.json();

    const created = await prisma.clientUnit.create({
      data: {
        clientId: data.clientId,
        brand: data.brand,
        model: data.model,
        powerKw: data.powerKw,
        serialNumber: data.serialNumber,
        installation: data.installation ? new Date(data.installation) : null,
        periodMonths: data.periodMonths || 12,
        location: data.location,
        notes: data.notes || ""
      }
    });

    return Response.json(created);
  } catch (error) {
    return Response.json(
      { error: "Hiba történt klíma létrehozásakor." },
      { status: 500 }
    );
  }
}
