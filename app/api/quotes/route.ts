import { prisma } from "@/lib/prisma";

// GET /api/quotes?clientId=123  – Ajánlatok listája (opcionális szűrés)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientIdParam = searchParams.get("clientId");
    const where = clientIdParam ? { clientId: Number(clientIdParam) } : undefined;

    const quotes = await prisma.quote.findMany({
      where,
      orderBy: { id: "desc" },
      include: { client: true },
    });

    return Response.json(quotes);
  } catch (e) {
    return Response.json({ error: "Hiba az ajánlatok lekérdezésekor." }, { status: 500 });
  }
}

// POST /api/quotes  – Ajánlat létrehozása { clientId, title?, terms? }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const clientId = Number(body.clientId);
    const title = body.title ? String(body.title) : null;
    const terms = body.terms ? String(body.terms) : null;

    if (!clientId) {
      return Response.json({ error: "A clientId kötelező." }, { status: 400 });
    }

    const created = await prisma.quote.create({
      data: {
        clientId,
        title,
        terms,
        status: "draft",
        netTotal: 0,
        vatAmount: 0,
        grossTotal: 0,
      },
    });

    return Response.json(created, { status: 201 });
  } catch (e) {
    return Response.json({ error: "Hiba az ajánlat létrehozásakor." }, { status: 500 });
  }
}
