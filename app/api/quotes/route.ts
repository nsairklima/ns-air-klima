import { prisma } from "@/lib/prisma";

// GET /api/quotes
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");
    const where = clientId ? { clientId: Number(clientId) } : undefined;

    const quotes = await prisma.quote.findMany({
      where,
      orderBy: { id: "desc" },
    });

    return Response.json(quotes);
  } catch (error) {
    return Response.json(
      { error: "Hiba történt ajánlatok lekérésekor." },
      { status: 500 }
    );
  }
}

// POST /api/quotes
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.clientId) {
      return Response.json(
        { error: "clientId kötelező" },
        { status: 400 }
      );
    }

    const quote = await prisma.quote.create({
      data: {
        clientId: Number(body.clientId),
        quoteNo: body.quoteNo ?? `Q-${Date.now()}`,
        status: "draft",
        netTotal: 0,
        vatAmount: 0,
        grossTotal: 0,
        terms: body.terms ?? null,
      },
    });

    return Response.json(quote);
  } catch (error) {
    return Response.json(
      { error: "Hiba történt az ajánlat létrehozásakor." },
      { status: 500 }
    );
  }
}
