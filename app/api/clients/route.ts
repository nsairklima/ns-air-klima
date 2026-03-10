import { prisma } from "@/lib/prisma";

// GET /api/clients – összes ügyfél listázása
export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { id: "desc" }
    });
    return Response.json(clients);
  } catch (error) {
    return Response.json({ error: "Hiba történt ügyfelek lekérésekor." }, { status: 500 });
  }
}

// POST /api/clients – új ügyfél létrehozása
export async function POST(req: Request) {
  try {
    const data = await req.json();

    const newClient = await prisma.client.create({
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        notes: data.notes || ""
      }
    });

    return Response.json(newClient);
  } catch (error) {
    return Response.json({ error: "Hiba új ügyfél létrehozásakor." }, { status: 500 });
  }
}
