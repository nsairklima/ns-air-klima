import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    // Feloldjuk a paramétereket, hogy biztosan elérhető legyen a quoteId
    const resolvedParams = await params;
    const { items } = await req.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Hibás adatformátum." }, { status: 400 });
    }

    // Tranzakcióban hajtjuk végre a frissítéseket a konzisztencia érdekében
    await prisma.$transaction(
      items.map((item: { id: number; sortOrder: number }) =>
        prisma.quoteItem.update({
          where: { id: Number(item.id) },
          data: { sortOrder: Number(item.sortOrder) },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Hiba a sorrend mentésekor:", error);
    return NextResponse.json(
      { error: "Nem sikerült menteni a sorrendet." },
      { status: 500 }
    );
  }
}
