import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ÜGYFÉL LEKÉRÉSE
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
        units: true,
        quotes: {
          orderBy: {
            createdAt: 'desc'
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

// ÜGYFÉL TÖRLÉSE
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = parseInt(params.id);

    if (isNaN(clientId)) {
      return NextResponse.json({ error: "Érvénytelen azonosító" }, { status: 400 });
    }

    // Tranzakcióban törlünk mindent, ami az ügyfélhez kötődik, 
    // hogy ne maradjanak árva adatok és ne legyen Foreign Key hiba.
    await prisma.$transaction([
      // 1. Értesítések törlése
      prisma.emailNotifications.deleteMany({ where: { clientId } }),
      // 2. Karbantartási naplók törlése a gépeken keresztül
      prisma.maintenanceLog.deleteMany({
        where: { unit: { clientId } }
      }),
      // 3. Gépek törlése
      prisma.clientUnit.deleteMany({ where: { clientId } }),
      // 4. Árajánlat tételek törlése az ajánlatokon keresztül
      prisma.quoteItem.deleteMany({
        where: { quote: { clientId } }
      }),
      // 5. Árajánlatok törlése
      prisma.quote.deleteMany({ where: { clientId } }),
      // 6. Végül az Ügyfél törlése
      prisma.client.delete({ where: { id: clientId } }),
    ]);

    return NextResponse.json({ message: "Ügyfél és minden adata sikeresen törölve." });
  } catch (error: any) {
    console.error("Hiba a törlés során:", error);
    return NextResponse.json({ error: "Hiba a törléskor: " + error.message }, { status: 500 });
  }
}
