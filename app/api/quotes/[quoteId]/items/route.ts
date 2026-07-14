import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Összesítő számoló segédfüggvény
async function updateQuoteTotals(quoteId: number) {
  const allItems = await prisma.quoteItem.findMany({ where: { quoteId } });
  const netTotal = allItems.reduce((sum, item) => sum + Number(item.lineNet), 0);
  const grossTotal = allItems.reduce((sum, item) => sum + Number(item.lineGross), 0);
  
  await prisma.quote.update({ 
    where: { id: quoteId }, 
    data: { netTotal, grossTotal } 
  });
}

// ÚJ TÉTEL LÉTREHOZÁSA (POST)
export async function POST(req: Request, { params }: { params: { quoteId: string } }) {
  try {
    const resolvedParams = await params;
    const data = await req.json();
    const qId = Number(resolvedParams.quoteId);
    
    // Lekérdezzük az eddigi legmagasabb sortOrder-t az ajánlathoz, hogy elkerüljük az ütközéseket
    const maxSortItem = await prisma.quoteItem.findFirst({
      where: { quoteId: qId },
      orderBy: { sortOrder: "desc" },
    });
    
    const nextSortOrder = maxSortItem ? maxSortItem.sortOrder + 1 : 0;

    const newItem = await prisma.quoteItem.create({
      data: {
        quoteId: qId,
        description: data.description,
        quantity: Number(data.quantity),
        unit: data.unit,
        costNet: Number(data.basePrice || 0),
        unitPriceNet: Number(data.unitPriceNet),
        vatRate: 27,
        lineNet: Number(data.quantity) * Number(data.unitPriceNet),
        lineGross: Math.round(Number(data.quantity) * Number(data.unitPriceNet) * 1.27),
        sortOrder: nextSortOrder, // Mindig a legmagasabb + 1-et kapja
      },
    });
    
    await updateQuoteTotals(qId);
    return NextResponse.json(newItem);
  } catch (error) {
    console.error("Hiba tétel hozzáadásakor:", error);
    return NextResponse.json({ error: "Hiba a mentéskor" }, { status: 500 });
  }
}

// TÉTEL MÓDOSÍTÁSA VAGY SORRENDEZÉS (PATCH)
export async function PATCH(req: Request, { params }: { params: { quoteId: string } }) {
  try {
    const resolvedParams = await params;
    const data = await req.json();
    const qId = Number(resolvedParams.quoteId);

    // HA A FRONTEND EGY LISTÁT KÜLD (Sorrendezés biztonsági fallback)
    if (data.items && Array.isArray(data.items)) {
      const updates = data.items.map((item: any) =>
        prisma.quoteItem.update({
          where: { id: Number(item.id) },
          data: { sortOrder: Number(item.sortOrder) },
        })
      );
      await Promise.all(updates);
      return NextResponse.json({ success: true });
    }

    // HA CSAK EGY TÉTELT MÓDOSÍTUNK (Szerkesztés)
    const updatedItem = await prisma.quoteItem.update({
      where: { id: Number(data.id) },
      data: {
        description: data.description,
        quantity: Number(data.quantity),
        unit: data.unit,
        costNet: Number(data.basePrice || 0),
        unitPriceNet: Number(data.unitPriceNet),
        lineNet: Number(data.quantity) * Number(data.unitPriceNet),
        lineGross: Math.round(Number(data.quantity) * Number(data.unitPriceNet) * 1.27),
      },
    });

    await updateQuoteTotals(qId);
    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Hiba módosításkor:", error);
    return NextResponse.json({ error: "Hiba a módosításkor" }, { status: 500 });
  }
}

// TÉTEL TÖRLÉSE (DELETE)
export async function DELETE(req: Request, { params }: { params: { quoteId: string } }) {
  try {
    const resolvedParams = await params;
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    const qId = Number(resolvedParams.quoteId);

    await prisma.quoteItem.delete({ where: { id } });
    await updateQuoteTotals(qId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Hiba törléskor:", error);
    return NextResponse.json({ error: "Hiba a törléskor" }, { status: 500 });
  }
}
