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
    const data = await req.json();
    const qId = Number(params.quoteId);

    const newItem = await prisma.quoteItem.create({
      data: {
        quoteId: qId,
        description: data.description,
        quantity: Number(data.quantity),
        unit: data.unit,
        costNet: Number(data.basePrice || 0), // Itt mentjük a beszerzési árat
        unitPriceNet: Number(data.unitPriceNet),
        vatRate: 27,
        lineNet: Number(data.quantity) * Number(data.unitPriceNet),
        lineGross: Math.round(Number(data.quantity) * Number(data.unitPriceNet) * 1.27),
      },
    });

    await updateQuoteTotals(qId);
    return NextResponse.json(newItem);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Hiba a mentéskor" }, { status: 500 });
  }
}

// TÉTEL MÓDOSÍTÁSA (PATCH)
export async function PATCH(req: Request, { params }: { params: { quoteId: string } }) {
  try {
    const data = await req.json();
    const qId = Number(params.quoteId);

    const updatedItem = await prisma.quoteItem.update({
      where: { id: Number(data.id) },
      data: {
        description: data.description,
        quantity: Number(data.quantity),
        unit: data.unit,
        costNet: Number(data.basePrice || 0), // Módosításnál is frissítjük az alapárat
        unitPriceNet: Number(data.unitPriceNet),
        lineNet: Number(data.quantity) * Number(data.unitPriceNet),
        lineGross: Math.round(Number(data.quantity) * Number(data.unitPriceNet) * 1.27),
      },
    });

    await updateQuoteTotals(qId);
    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Hiba a módosításkor" }, { status: 500 });
  }
}

// TÉTEL TÖRLÉSE (DELETE)
export async function DELETE(req: Request, { params }: { params: { quoteId: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    await prisma.quoteItem.delete({ where: { id } });
    await updateQuoteTotals(Number(params.quoteId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Hiba a törléskor" }, { status: 500 });
  }
}
