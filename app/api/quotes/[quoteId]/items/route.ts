import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const data = await req.json();
    const quoteId = Number(params.quoteId);

    const newItem = await prisma.quoteItem.create({
      data: {
        quoteId,
        description: data.description,
        quantity: Number(data.quantity),
        unit: data.unit || "db", // Itt mentjük az egységet (db, m, stb.)
        unitPriceNet: Number(data.unitPriceNet),
        vatRate: Number(data.vatRate),
        lineNet: Number(data.quantity) * Number(data.unitPriceNet),
        lineGross: Number(data.quantity) * Number(data.unitPriceNet) * (1 + Number(data.vatRate) / 100),
      },
    });

    // Frissítsük az ajánlat összesítőit is
    const allItems = await prisma.quoteItem.findMany({ where: { quoteId } });
    const netTotal = allItems.reduce((sum, item) => sum + item.lineNet, 0);
    const grossTotal = allItems.reduce((sum, item) => sum + item.lineGross, 0);

    await prisma.quote.update({
      where: { id: quoteId },
      data: { netTotal, grossTotal },
    });

    return NextResponse.json(newItem);
  } catch (error) {
    return NextResponse.json({ error: "Hiba a tétel mentésekor" }, { status: 500 });
  }
}

// TÉTEL TÖRLÉSE
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    const deletedItem = await prisma.quoteItem.delete({
      where: { id },
    });

    // Újra kell számolni az összesítőt a törlés után
    const quoteId = deletedItem.quoteId;
    const allItems = await prisma.quoteItem.findMany({ where: { quoteId } });
    const netTotal = allItems.reduce((sum, item) => sum + item.lineNet, 0);
    const grossTotal = allItems.reduce((sum, item) => sum + item.lineGross, 0);

    await prisma.quote.update({
      where: { id: quoteId },
      data: { netTotal, grossTotal },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Hiba a törléskor" }, { status: 500 });
  }
}
