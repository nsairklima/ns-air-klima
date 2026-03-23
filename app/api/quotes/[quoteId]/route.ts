import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: Number(params.quoteId) },
      include: {
        client: true,
        items: {
          orderBy: {
            id: 'asc'}// Ez garantálja, hogy a létrehozás sorrendjében maradnak!
          
        },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: "Ajánlat nem található" }, { status: 404 });
    }

    return NextResponse.json(quote);
  } catch (error) {
    return NextResponse.json({ error: "Hiba a lekéréskor" }, { status: 500 });
  }
}

// PATCH /api/quotes/[quoteId] – { title?, terms?, status? }
export async function PATCH(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const id = Number(params.quoteId);
    const body = await req.json();

    const data: any = {};
    if (typeof body.title === "string") data.title = body.title;
    if (typeof body.terms === "string") data.terms = body.terms;
    if (typeof body.status === "string" && ["draft","sent","accepted","rejected"].includes(body.status)) {
      data.status = body.status;
    }

    const updated = await prisma.quote.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: "Hiba a frissítéskor." }, { status: 500 });
  }
}
