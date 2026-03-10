import { prisma } from "@/lib/prisma";

// GET /api/quotes/:quoteId – ajánlat lekérése
export async function GET(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: Number(params.quoteId) },
      include: {
        client: true,
        items: true
      }
    });

    if (!quote) {
      return Response.json(
        { error: "Ajánlat nem található." },
        { status: 404 }
      );
    }

    return Response.json(quote);
  } catch (error) {
    return Response.json(
      { error: "Hiba az ajánlat lekérésekor." },
      { status: 500 }
    );
  }
}

// PUT /api/quotes/:quoteId – ajánlat módosítása
export async function PUT(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const data = await req.json();

    const updated = await prisma.quote.update({
      where: { id: Number(params.quoteId) },
      data: {
        terms: data.terms,
        status: data.status,
        netTotal: data.netTotal,
        vatAmount: data.vatAmount,
        grossTotal: data.grossTotal,
        profit: data.profit
      }
    });

    return Response.json(updated);
  } catch (error) {
    return Response.json(
      { error: "Hiba az ajánlat módosításakor." },
      { status: 500 }
    );
  }
}

// DELETE /api/quotes/:quoteId – ajánlat törlése
export async function DELETE(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    await prisma.quote.delete({
      where: { id: Number(params.quoteId) }
    });

    return Response.json({ message: "Ajánlat törölve." });
  } catch (error) {
    return Response.json(
      { error: "Hiba az ajánlat törlésekor." },
      { status: 500 }
    );
  }
}
