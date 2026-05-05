import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// --- AJÁNLAT LEKÉRÉSE ---
export async function GET(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const id = parseInt(params.quoteId);
    if (isNaN(id)) return NextResponse.json({ error: "Érvénytelen ID" }, { status: 400 });

    const quote = await prisma.quote.findUnique({
      where: { id: id },
      include: {
        items: true,
        client: { include: { units: true } }, // Így a klíma adatai is jönnek
      },
    });

    if (!quote) return NextResponse.json({ error: "Nincs meg az ajánlat" }, { status: 404 });
    return NextResponse.json(quote);
  } catch (error) {
    return NextResponse.json({ error: "Hiba a lekéréskor" }, { status: 500 });
  }
}

// --- AJÁNLAT FRISSÍTÉSE (Ez hiányzott a cím mentéséhez!) ---
export async function PATCH(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const id = parseInt(params.quoteId);
    const body = await req.json();

    if (isNaN(id)) return NextResponse.json({ error: "Érvénytelen ID" }, { status: 400 });

    const updatedQuote = await prisma.quote.update({
      where: { id: id },
      data: {
        title: body.title, // Itt mentjük el az új címet
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
    const id = parseInt(params.quoteId);
    if (isNaN(id)) return NextResponse.json({ error: "Érvénytelen ID" }, { status: 400 });

    await prisma.$transaction([
      prisma.quoteItem.deleteMany({ where: { quoteId: id } }),
      prisma.quote.delete({ where: { id: id } }),
    ]);

    return NextResponse.json({ message: "Sikeres törlés" });
  } catch (error: any) {
    return NextResponse.json({ error: "Törlési hiba" }, { status: 500 });
  }
}
