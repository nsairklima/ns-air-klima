import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// --- AJÁNLAT LEKÉRÉSE ---
export async function GET(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    // Next.js fix: várjuk meg a paramétereket
    const { quoteId } = await params; 
    const id = parseInt(quoteId);

    if (isNaN(id)) return NextResponse.json({ error: "Érvénytelen ID" }, { status: 400 });

    const quote = await prisma.quote.findUnique({
      where: { id: id },
      include: {
        items: true,
        client: { include: { units: true } },
      },
    });

    if (!quote) return NextResponse.json({ error: "Nincs meg az ajánlat" }, { status: 404 });
    return NextResponse.json(quote);
  } catch (error) {
    return NextResponse.json({ error: "Hiba a lekéréskor" }, { status: 500 });
  }
}

// --- AJÁNLAT FRISSÍTÉSE ---
export async function PATCH(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const { quoteId } = await params;
    const id = parseInt(quoteId);
    const body = await req.json();

    if (isNaN(id)) return NextResponse.json({ error: "Érvénytelen ID" }, { status: 400 });

    const updatedQuote = await prisma.quote.update({
      where: { id: id },
      data: {
        title: body.title, 
      },
    });

    return NextResponse.json(updatedQuote);
  } catch (error) {
    console.error("PATCH hiba:", error);
    return NextResponse.json({ error: "Nem sikerült a módosítás" }, { status: 500 });
  }
}

// --- AJÁNLAT TÖRLÉSE ---
export async function DELETE(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const { quoteId } = await params;
    const id = parseInt(quoteId);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Érvénytelen ID" }, { status: 400 });
    }

    // Ellenőrizzük, létezik-e az ajánlat törlés előtt
    const existing = await prisma.quote.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Az ajánlat már nem létezik" }, { status: 404 });
    }

    // Tranzakció: először a tételek, aztán az ajánlat
    await prisma.$transaction(async (tx) => {
      await tx.quoteItem.deleteMany({
        where: { quoteId: id },
      });
      await tx.quote.delete({
        where: { id: id },
      });
    });

    return NextResponse.json({ message: "Sikeres törlés" });
  } catch (error: any) {
    console.error("Törlési hiba az API-ban:", error);
    return NextResponse.json({ error: "Törlési hiba: " + error.message }, { status: 500 });
  }
}
