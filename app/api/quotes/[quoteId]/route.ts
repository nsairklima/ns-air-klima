import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { quoteId: string } }) {
  try {
    const id = Number(params.quoteId);
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: { items: true, client: true },
    });
    if (!quote) return Response.json({ error: "Ajánlat nem található." }, { status: 404 });
    return Response.json(quote);
  } catch (error) {
    return Response.json(
      { error: "Hiba történt ajánlat lekérésekor." },
      { status: 500 }
    );
  }
}
