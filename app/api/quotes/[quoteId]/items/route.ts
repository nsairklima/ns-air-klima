import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ÚJ TÉTEL VAGY MÓDOSÍTÁS UTÁNI ÖSSZESÍTŐ SZÁMOLÁS
async function updateQuoteTotals(quoteId: number) {
  const allItems = await prisma.quoteItem.findMany({ where: { quoteId } });
  const netTotal = allItems.reduce((sum, item) => sum + Number(item.lineNet), 0);
  const grossTotal = allItems.reduce((sum, item) => sum + Number(item.lineGross), 0);

  await prisma.quote.update({
    where: { id: quoteId },
    data: { netTotal, grossTotal },
  });
}

export async function POST(req: Request, { params }: { params: { quoteId: string } }) {
  const data = await req.json();
  const quoteId = Number(params.quoteId);
  const newItem = await prisma.quoteItem.create({
    data: {
      quoteId,
      description: data.description,
      quantity: Number(data.quantity),
      unit: data.unit,
      unitPriceNet: Number(data.unitPriceNet),
      vatRate: Number(data.vatRate),
      lineNet: Number(data.quantity) * Number(data.unitPriceNet),
      lineGross: Number(data.quantity) * Number(data.unitPriceNet) * (1 + Number(data.vatRate) / 100),
    },
  });
  await updateQuoteTotals(quoteId);
  return NextResponse.json(newItem);
}

// ÚJ: TÉTEL FRISSÍTÉSE
export async function PATCH(req: Request, { params }: { params: { quoteId: string } }) {
  const data = await req.json();
  const updatedItem = await prisma.quoteItem.update({
    where: { id: Number(data.id) },
    data: {
      description: data.description,
      quantity: Number(data.quantity),
      unit: data.unit,
      unitPriceNet: Number(data.unitPriceNet),
      vatRate: Number(data.vatRate),
      lineNet: Number(data.quantity) * Number(data.unitPriceNet),
      lineGross: Number(data.quantity) * Number(data.unitPriceNet) * (1 + Number(data.vatRate) / 100),
    },
  });
  await updateQuoteTotals(Number(params.quoteId));
  return NextResponse.json(updatedItem);
}

export async function DELETE(req: Request, { params }: { params: { quoteId: string } }) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  await prisma.quoteItem.delete({ where: { id } });
  await updateQuoteTotals(Number(params.quoteId));
  return NextResponse.json({ success: true });
}
