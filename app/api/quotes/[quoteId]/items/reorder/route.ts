import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const { items } = await req.json();

    // Megvárjuk, amíg az összes tétel sorrendje frissül az adatbázisban
    // A tranzakció (transaction) biztosítja, hogy vagy minden frissül, vagy semmi
    await prisma.$transaction(
      items.map((item: { id: number; sortOrder: number }) =>
        prisma.quoteItem.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
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
