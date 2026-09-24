import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Összesítő számoló segédfüggvény
async function updateQuoteTotals(quoteId: number) {
  const allItems = await prisma.quoteItem.findMany({
    where: { quoteId },
  });

  const netTotal = allItems.reduce(
    (sum, item) => sum + Number(item.lineNet),
    0
  );

  const vatAmount = allItems.reduce(
    (sum, item) => sum + Number(item.lineVat),
    0
  );

  const grossTotal = allItems.reduce(
    (sum, item) => sum + Number(item.lineGross),
    0
  );

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      netTotal,
      vatAmount,
      grossTotal,
    },
  });
}

// ÚJ TÉTEL LÉTREHOZÁSA
export async function POST(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const data = await req.json();
    const qId = Number(params.quoteId);

    const quantity = Number(data.quantity || 0);
    const costNet = Number(
  data.costNet !== undefined
    ? data.costNet
    : data.basePrice || 0
);
    const unitPriceNet = Number(data.unitPriceNet || 0);

    const lineNet = unitPriceNet * quantity;
    const lineVat = lineNet * 0.27;
    const lineGross = lineNet + lineVat;

    const profitAbs = (unitPriceNet - costNet) * quantity;

    const profitPct =
      costNet > 0
        ? ((unitPriceNet - costNet) / costNet) * 100
        : 0;

    const newItem = await prisma.quoteItem.create({
      data: {
        quoteId: qId,
        description: data.description,
        quantity,
        unit: data.unit || "db",

        costNet,
        unitPriceNet,
        vatRate: 27,

        lineNet: Math.round(lineNet),
        lineVat: Math.round(lineVat),
        lineGross: Math.round(lineGross),

        profitAbs: Math.round(profitAbs * 100) / 100,
        profitPct: Math.round(profitPct * 100) / 100,

        sortOrder: Number(data.sortOrder || 0),
      },
    });

    await updateQuoteTotals(qId);

    return NextResponse.json(newItem);
  } catch (error: any) {
    console.error("Tétel létrehozási hiba:", error);

    return NextResponse.json(
      {
        error: "Hiba a mentéskor",
        details: error?.message,
      },
      { status: 500 }
    );
  }
}

// TÉTEL MÓDOSÍTÁSA VAGY SORRENDEZÉS
export async function PATCH(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const data = await req.json();
    const qId = Number(params.quoteId);

    // Sorrendezés
    if (data.items && Array.isArray(data.items)) {
      const updates = data.items.map((item: any) =>
        prisma.quoteItem.update({
          where: { id: Number(item.id) },
          data: {
            sortOrder: Number(item.sortOrder),
          },
        })
      );

      await Promise.all(updates);

      return NextResponse.json({ success: true });
    }

    // Egy tétel módosítása
    const quantity = Number(data.quantity || 0);
    const costNet = Number(
  data.costNet !== undefined
    ? data.costNet
    : data.basePrice || 0
);
 
