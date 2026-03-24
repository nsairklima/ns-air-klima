import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: Number(params.quoteId) },
      include: {
        client: {
          include: {
            units: true,
          },
        },
        items: true,
      },
    });

    if (!quote) {
      return NextResponse.json({ error: "Ajánlat nem található" }, { status: 404 });
    }

    return NextResponse.json(quote);
  } catch (error) {
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 });
  }
}
