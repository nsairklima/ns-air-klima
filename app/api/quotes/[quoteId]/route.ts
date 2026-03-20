import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/quotes/[quoteId] – Ajánlat + tételek
export async function GET(
  _req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const id = Number(params.quoteId);
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: { client: true, items: true },
    });
    if (!quote) return NextResponse.json({ error: "Nem található." }, { status: 404 });
    return NextResponse.json(quote);
  } catch (e) {
    return NextResponse.json({ error: "Hiba a lekérdezéskor." }, { status: 500 });
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
