import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

// Új tétel létrehozása
export async function POST(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const data = await req.json();
    const qId = Number(params.quoteId);

    

    const quantity = Number(data.quantity || 0);
    const costNet = Number(data.costNet || data.basePrice || 0);
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
        details: error?.message || "Ismeretlen hiba",
      },
      { status: 500 }
    );
  }
}

// Tétel módosítása vagy sorrendezése
export async function PATCH(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const data = await req.json();
    const qId = Number(params.quoteId);

    // Az ajánlat összes tételének újraszámítása
if (data.recalculateAll === true) {
  const items = await prisma.quoteItem.findMany({
    where: { quoteId: qId },
  });

  const updates = items.map((item) => {
    const quantity = Number(item.quantity || 0);
    const costNet = Number(item.costNet || 0);
    const unitPriceNet = Number(item.unitPriceNet || 0);

    const lineNet = unitPriceNet * quantity;
    const lineVat = lineNet * 0.27;
    const lineGross = lineNet + lineVat;

    const profitAbs = (unitPriceNet - costNet) * quantity;

    const profitPct =
      costNet > 0
        ? ((unitPriceNet - costNet) / costNet) * 100
        : 0;

    return prisma.quoteItem.update({
      where: { id: item.id },
      data: {
        lineNet: Math.round(lineNet),
        lineVat: Math.round(lineVat),
        lineGross: Math.round(lineGross),
        profitAbs: Math.round(profitAbs * 100) / 100,
        profitPct: Math.round(profitPct * 100) / 100,
      },
    });
  });

  await prisma.$transaction(updates);
  await updateQuoteTotals(qId);

  const refreshedItems = await prisma.quoteItem.findMany({
    where: { quoteId: qId },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({
    success: true,
    message: "Az ajánlat minden tétele újraszámolva.",
    items: refreshedItems,
  });
}

    // Sorrendezés
    if (data.items && Array.isArray(data.items)) {
      const updates = data.items.map((item: any) =>
        prisma.quoteItem.update({
          where: {
            id: Number(item.id),
          },
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
    const costNet = Number(data.costNet || data.basePrice || 0);
    const unitPriceNet = Number(data.unitPriceNet || 0);

    const lineNet = unitPriceNet * quantity;
    const lineVat = lineNet * 0.27;
    const lineGross = lineNet + lineVat;

    const profitAbs = (unitPriceNet - costNet) * quantity;

    const profitPct =
      costNet > 0
        ? ((unitPriceNet - costNet) / costNet) * 100
        : 0;

    const updatedItem = await prisma.quoteItem.update({
      where: {
        id: Number(data.id),
      },
      data: {
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

    return NextResponse.json(updatedItem);
  } catch (error: any) {
    console.error("Tétel módosítási hiba:", error);

    return NextResponse.json(
      {
        error: "Hiba a módosításkor",
        details: error?.message || "Ismeretlen hiba",
      },
      { status: 500 }
    );
  }
}

// Tétel törlése
export async function DELETE(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);

    const id = Number(searchParams.get("id"));
    const qId = Number(params.quoteId);

    if (!id || Number.isNaN(id)) {
      return NextResponse.json(
        { error: "Hiányzó vagy hibás tételazonosító" },
        { status: 400 }
      );
    }

    await prisma.quoteItem.delete({
      where: { id },
    });

    await updateQuoteTotals(qId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Tétel törlési hiba:", error);

    return NextResponse.json(
      {
        error: "Hiba a törléskor",
        details: error?.message || "Ismeretlen hiba",
      },
      { status: 500 }
    );
  }
}
