import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// --- AJÁNLAT LEKÉRÉSE (Szerkesztéshez kell) ---
export async function GET(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const id = parseInt(params.quoteId);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Érvénytelen ID" }, { status: 400 });
    }

    const quote = await prisma.quote.findUnique({
      where: { id: id },
      include: {
        items: true, // Beletesszük a tételeket is
        client: true, // Opcionális: az ügyfél adatait is láthatjuk
      },
    });

    if (!quote) {
      return NextResponse.json({ error: "Az ajánlat nem található." }, { status: 404 });
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error("Lekérdezési hiba:", error);
    return NextResponse.json({ error: "Hiba az adatok lekérésekor." }, { status: 500 });
  }
}

// --- AJÁNLAT TÖRLÉSE (Már megírtad, tranzakcióval) ---
export async function DELETE(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const id = parseInt(params.quoteId);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Érvénytelen ID" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.quoteItem.deleteMany({
        where: { quoteId: id },
      }),
      prisma.quote.delete({
        where: { id: id },
      }),
    ]);

    return NextResponse.json({ message: "Sikeres törlés" });
  } catch (error: any) {
    console.error("Törlési hiba:", error);
    return NextResponse.json(
      { error: "Nem sikerült törölni az ajánlatot." },
      { status: 500 }
    );
  }
}
