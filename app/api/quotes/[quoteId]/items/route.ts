import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST /api/quotes/[quoteId]/items
// Body: { description, quantity, unit?, unitPriceNet, vatRate? (alap 27), costNet? }
export async function POST(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const quoteId = Number(params.quoteId);
    const b = await req.json();

    const description = String(b.description || "").trim();
    if (!description) return NextResponse.json({ error: "A tétel leírása kötelező." }, { status: 400 });

    const quantity = b.quantity != null ? Number(b.quantity) : 1;
    const unit = b.unit ? String(b.unit) : null;
    const unitPriceNet = b.unitPriceNet != null ? Number(b.unitPriceNet) : 0;
    const vatRate = b.vatRate != null ? Number(b.vatRate) : 27;
    const costNet = b.costNet != null && b.costNet !== "" ? Number(b.costNet) : null;

    const lineNet = round2(quantity * unitPriceNet);
    const lineVat = round2(lineNet * (vatRate / 100));
    const lineGross = round2(lineNet + lineVat);

    const created = await prisma.quoteItem.create({
      data: {
        quoteId,
        description,
        quantity,
        unit,
        unitPriceNet,
        vatRate,
        lineNet,
        lineVat,
        lineGross,
        costNet,
        profitAbs: costNet != null ? round2(lineNet - costNet) : null,
        profitPct: costNet != null && costNet > 0 ? round2(((lineNet - costNet) / costNet) * 100) : null,
      },
    });

    // Újraszámoljuk az ajánlat összesítőit
    const all = await prisma.quoteItem.findMany({ where: { quoteId } });
    const netTotal = round2(all.reduce((s, it) => s + Number(it.lineNet), 0));
    const vatAmount = round2(all.reduce((s, it) => s + Number(it.lineVat), 0));
    const grossTotal = round2(netTotal + vatAmount);

    await prisma.quote.update({
      where: { id: quoteId },
      data: { netTotal, vatAmount, grossTotal },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Hiba a tétel mentésekor." }, { status: 500 });
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
