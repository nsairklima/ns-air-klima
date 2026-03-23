import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    const data = await req.json();
    
    // Frissítés a Prismával
    const updatedItem = await prisma.quoteItem.update({
      where: { id: Number(params.itemId) },
      data: {
        // Itt volt a hiba: 'name' helyett 'description' kell
        description: data.description || data.name, 
        basePriceNet: data.basePriceNet ? Number(data.basePriceNet) : undefined,
        profitValue: data.profitValue ? Number(data.profitValue) : undefined,
        profitType: data.profitType, // 'FIXED' vagy 'PERCENT'
        quantity: data.quantity ? Number(data.quantity) : undefined,
        unitPriceNet: data.unitPriceNet ? Number(data.unitPriceNet) : undefined,
        vatRate: data.vatRate ? Number(data.vatRate) : undefined,
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Hiba a tétel frissítésekor:", error);
    return NextResponse.json({ error: "Sikertelen frissítés" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    await prisma.quoteItem.delete({
      where: { id: Number(params.itemId) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Sikertelen törlés" }, { status: 500 });
  }
}
