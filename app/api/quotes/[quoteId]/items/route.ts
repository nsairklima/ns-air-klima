import { prisma } from "@/lib/prisma";

async function recalcTotals(quoteId: number) {
  const items = await prisma.quoteItem.findMany({ where: { quoteId } });
  const net = items.reduce((s, i) => s + i.finalPriceNet * i.qty, 0);
  const vat = Math.round(net * 0.27);
  const gross = net + vat;

  await prisma.quote.update({
    where: { id: quoteId },
    data: { netTotal: net, vatAmount: vat, grossTotal: gross },
  });
}

export async function POST(req: Request, { params }: { params: { quoteId: string } }) {
  try {
    const quoteId = Number(params.quoteId);
    const body = await req.json();

    if (!body.name || !body.basePriceNet || !body.qty) {
      return Response.json(
        { error: "Név, nettó ár és mennyiség kötelező." },
        { status: 400 }
      );
    }

    const base = Number(body.basePriceNet);
    const qty = Number(body.qty);
    const profitValue = Number(body.profitValue ?? 0);

    const unitFinal =
      body.profitType === "percent"
        ? Math.round(base * (1 + profitValue / 100))
        : base + profitValue;

    const item = await prisma.quoteItem.create({
      data: {
        quoteId,
        name: body.name,
        basePriceNet: base,
        profitType: body.profitType,
        profitValue,
        finalPriceNet: unitFinal,
        qty,
      },
    });

    await recalcTotals(quoteId);

    return Response.json(item);
  } catch (error) {
    return Response.json(
      { error: "Hiba történt tétel mentésekor." },
      { status: 500 }
    );
  }
}
