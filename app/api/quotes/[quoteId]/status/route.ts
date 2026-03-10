import { prisma } from "@/lib/prisma";

// PATCH /api/quotes/:quoteId/status
export async function PATCH(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const data = await req.json();

    const updated = await prisma.quote.update({
      where: { id: Number(params.quoteId) },
      data: {
        status: data.status
      }
    });

    return Response.json(updated);
  } catch (error) {
    return Response.json(
      { error: "Hiba az ajánlat státusz módosításakor." },
      { status: 500 }
    );
  }
}
