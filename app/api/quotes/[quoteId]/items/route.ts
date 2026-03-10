import { prisma } from "@/lib/prisma";

// GET /api/quotes/:quoteId/items – tételsorok listázása
export async function GET(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const items = await prisma.quoteItem.findMany({
      where: { quoteId: Number(params.quoteId) },
      orderBy: { id: "asc" }
    });

    return Response.json(items);
  } catch (error) {
    return Response.json(
      { error: "Hiba a tételsorok lekérésekor." },
      { status: 500 }
    );
  }
}

// POST /api/quotes/:quoteId/items – új tételsor felvétele
export async function POST(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const data = await req.json();

    // profit kiszámolása
    let profitAmount = 0;

    if (data.profitType === "percent") {
      profitAmount = Math.round((data.basePriceNet * data.profitValue) / 100);
    } else if (data.profitType === "amount") {
      profitAmount = data.profitValue;
    }

    const finalPriceNet = data.basePriceNet + profitAmount;

    const created = await prisma.quoteItem.create({
      data: {
        quoteId: Number(params.quoteId),
        name: data.name,
        basePriceNet: data.basePriceNet,
        profitValue: data.profitValue,
        profitType: data.profitType,
        finalPriceNet,
        qty: data.qty || 1
      }
    });

    return Response.json(created);
  } catch (error) {
    return Response.json(
      { error: "Hiba a tételsor létrehozásakor." },
      { status: 500 }
    );
  }
}
