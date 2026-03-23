import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function updateQuoteTotals(quoteId: number) {
  const allItems = await prisma.quoteItem.findMany({ where: { quoteId } });
  const netTotal = allItems.reduce((sum, item) => sum + Number(item.lineNet), 0);
  const grossTotal = allItems.reduce((sum, item) => sum + Number(item.lineGross), 0);
  await prisma.quote.update({ where: { id: quoteId }, data: { netTotal, grossTotal } });
}

export async function POST(req: Request, { params }: { params: { quoteId: string } }) {
  const data = await req.json();
 // Részlet az API route.ts fájlból
const newItem = await prisma.quoteItem.create({
  data: {
    quoteId: Number(params.quoteId),
    description: data.description,
    quantity: Number(data.quantity),
    unit: data.unit,
    costNet: Number(data.basePrice), // A frontend 'basePrice'-t küld, de 'costNet'-be mentjük
    unitPriceNet: Number(data.unitPriceNet),
    // ... a többi marad
  },
})
      
      unitPriceNet: Number(data.unitPriceNet), // Eladási nettó
      vatRate: 27,
      lineNet: Number(data.quantity) * Number(data.unitPriceNet),
      lineGross: Math.round(Number(data.quantity) * Number(data.unitPriceNet) * 1.27),
      // Opcionális: Ha a sémád engedi, ide menthetnénk a basePrice-t. 
      // Ha a séma nem engedi, a frontendben oldjuk meg a fix visszatöltést.
    },
  });
  await updateQuoteTotals(Number(params.quoteId));
  return NextResponse.json(newItem);
}

export async function PATCH(req: Request, { params }: { params: { quoteId: string } }) {
  const data = await req.json();
  const updatedItem = await prisma.quoteItem.update({
    where: { id: Number(data.id) },
    data: {
      description: data.description,
      quantity: Number(data.quantity),
      unit: data.unit,
      unitPriceNet: Number(data.unitPriceNet),
      lineNet: Number(data.quantity) * Number(data.unitPriceNet),
      lineGross: Math.round(Number(data.quantity) * Number(data.unitPriceNet) * 1.27),
    },
  });
  await updateQuoteTotals(Number(params.quoteId));
  return NextResponse.json(updatedItem);
}
// ... a DELETE marad a régi
