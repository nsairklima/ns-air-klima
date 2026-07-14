import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const originalId = Number(params.quoteId);

    // 1. Lekérjük az eredeti ajánlatot és a hozzá tartozó tételeket
    const originalQuote = await prisma.quote.findUnique({
      where: { id: originalId },
      include: { items: true },
    });

    if (!originalQuote) {
      return NextResponse.json({ error: "Az eredeti ajánlat nem található" }, { status: 404 });
    }

    // 2. Létrehozzuk az új ajánlatot az eredeti adatokkal (új címmel és friss dátummal)
    const clonedQuote = await prisma.quote.create({
      data: {
        title: `${originalQuote.title} - Másolat`,
        clientId: originalQuote.clientId,
        grossTotal: originalQuote.grossTotal,
        // Ha van más egyedi meződ az ajánlatban (pl. állapot, leírás), azt is ideveheted:
        // status: "draft"
      },
    });

    // 3. Átmásoljuk az összes tételt az új ajánlathoz
    if (originalQuote.items.length > 0) {
      const clonedItemsData = originalQuote.items.map((item) => ({
        quoteId: clonedQuote.id, // Az új ajánlat ID-ja
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        basePrice: item.basePrice,
        unitPriceNet: item.unitPriceNet,
        lineGross: item.lineGross,
        sortOrder: item.sortOrder,
      }));

      await prisma.quoteItem.createMany({
        data: clonedItemsData,
      });
    }

    return NextResponse.json({ success: true, newQuoteId: clonedQuote.id });
  } catch (error) {
    console.error("Hiba az ajánlat másolásakor:", error);
    return NextResponse.json({ error: "Sikertelen másolás" }, { status: 500 });
  }
}
