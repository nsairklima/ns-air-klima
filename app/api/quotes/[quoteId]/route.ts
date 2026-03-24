// app/api/quotes/[quoteId]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    // A params.quoteId-t számmá alakítjuk
    const id = parseInt(params.quoteId);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Érvénytelen ID" }, { status: 400 });
    }

    // Tranzakció: először a tételek, aztán az ajánlat
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
