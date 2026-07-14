import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: any }
) {
  try {
    // Univerzális feloldás: működik Next.js 13, 14 és 15+ verziókkal is
    const resolvedParams = params instanceof Promise ? await params : params;
    const quoteId = resolvedParams?.quoteId;

    const { items } = await req.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Hibás adatformátum." }, { status: 400 });
    }

    await prisma.$transaction(
      items.map((item: { id: number; sortOrder: number }) =>
        prisma.quoteItem.update({
          where: { 
            id: Number(item.id),
            quoteId: String(quoteId) 
          },
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
