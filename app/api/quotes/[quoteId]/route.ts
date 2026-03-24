import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ... GET és PATCH metódusok ...

export async function DELETE(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const id = Number(params.quoteId);

    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Érvénytelen azonosító" }, { status: 400 });
    }

    // Tranzakciót használunk, hogy vagy mindkettő sikerüljön, vagy egyik se
    await prisma.$transaction([
      // 1. Töröljük az ajánlathoz tartozó összes tételt
      prisma.quoteItem.deleteMany({
        where: { quoteId: id },
      }),
      // 2. Töröljük magát az ajánlatot
      prisma.quote.delete({
        where: { id: id },
      }),
    ]);

    return NextResponse.json({ ok: true, message: "Ajánlat és tételei törölve" });
  } catch (error: any) {
    console.error("Hiba az ajánlat törlésekor:", error);
    return NextResponse.json(
      { error: "Nem sikerült törölni az ajánlatot: " + error.message },
      { status: 500 }
    );
  }
}
