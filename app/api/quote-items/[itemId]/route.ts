import { prisma } from "@/lib/prisma";

// GET /api/quote-items/:itemId – egy tételsor lekérése
export async function GET(
  req: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    const item = await prisma.quoteItem.findUnique({
      where: { id: Number(params.itemId) }
    });

    if (!item) {
      return Response.json({ error: "A tétel nem található." }, { status: 404 });
    }

    return Response.json(item);
  } catch (error) {
    return Response.json(
      { error: "Hiba a tételsor lekérésekor." },
      { status: 500 }
    );
  }
}

// PUT /api/quote-items/:itemId – tételsor módosítása
export async function PUT(
  req: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    const data = await req.json();

    // új profit számolás
    let profitAmount = 0;

    if (data.profitType === "percent") {
      profitAmount = Math.round((data.basePriceNet * data.profitValue) / 100);
    } else if (data.profitType === "amount") {
      profitAmount = data.profitValue;
    }

    const finalPriceNet = data.basePriceNet + profitAmount;

    const updated = await prisma.quoteItem.update({
      where: { id: Number(params.itemId) },
      data: {
        name: data.name,
        basePriceNet: data.basePriceNet,
        profitValue: data.profitValue,
        profitType: data.profitType,
        finalPriceNet,
        qty: data.qty
      }
    });

    return Response.json(updated);
  } catch (error) {
    return Response.json(
      { error: "Hiba a tételsor módosításakor." },
      { status: 500 }
    );
  }
}

// DELETE /api/quote-items/:itemId – törlés
export async function DELETE(
  req: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    await prisma.quoteItem.delete({
      where: { id: Number(params.itemId) }
    });

    return Response.json({ message: "Tételsor törölve." });
  } catch (error) {
    return Response.json(
      { error: "Hiba a tételsor törlésekor." },
      { status: 500 }
    );
  }
}
