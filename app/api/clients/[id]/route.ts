import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = parseInt(params.id);

    if (isNaN(clientId)) {
      return NextResponse.json({ error: "Érvénytelen ügyfél azonosító" }, { status: 400 });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        units: true,  // Telepített gépek
        quotes: {     // ÁRAJÁNLATOK BEEMELÉSE
          orderBy: {
            createdAt: 'desc' // A legfrissebb legyen legfelül
          }
        }
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Ügyfél nem található" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Hiba az ügyfél lekérésekor:", error);
    return NextResponse.json({ error: "Belső szerverhiba" }, { status: 500 });
  }
}
