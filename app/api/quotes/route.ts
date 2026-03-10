import { prisma } from "@/lib/prisma";

// GET /api/quotes – ajánlatok listázása
export async function GET() {
  try {
    const list = await prisma.quote.findMany({
      include: {
        client: true,
        items: true
      },
      orderBy: { id: "desc" }
    });

    return Response.json(list);
  } catch (error) {
    return Response.json(
      { error: "Hiba az ajánlatok lekérésekor." },
      { status: 500 }
    );
  }
}

// POST /api/quotes – új ajánlat létrehozása
export async function POST(req: Request) {
  try {
    const data = await req.json();

    // automatikus ajánlatszám generálás
    const quoteNo = "NS-" + Date.now();

    const created = await prisma.quote.create({
      data: {
        clientId: data.clientId,
        quoteNo,
        terms: data.terms || "",
        status: "draft"
      }
    });

    return Response.json(created);
  } catch (error) {
    return Response.json(
      { error: "Hiba az új ajánlat létrehozásakor." },
      { status: 500 }
    );
  }
}
