import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Összes ajánlat lekérése
export async function GET() {
  try {
    const quotes = await prisma.quote.findMany({
      include: { 
        client: true,
        items: true // Beemeljük a tételeket is a lekérésbe
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(quotes);
  } catch (error: any) {
    // ITT IS JAVÍTVA: Most már látni fogod a GET hibáját is a logban
    console.error("GET API HIBA:", error);
    return NextResponse.json({ 
      error: "Hiba a lekéréskor", 
      details: error.message,
      code: error.code 
    }, { status: 500 });
  }
}

// Új ajánlat létrehozása és mentése az ügyfélhez
export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Ellenőrizzük, hogy van-e clientId
    if (!data.clientId) {
      return NextResponse.json({ error: "Ügyfél kiválasztása kötelező!" }, { status: 400 });
    }

    // Létrehozzuk az ajánlatot ÉS a hozzá tartozó tételeket egyszerre
    const newQuote = await prisma.quote.create({
      data: {
        clientId: Number(data.clientId),
        status: data.status || "draft",
        title: data.title || "Klíma telepítés ajánlat",
        terms: data.terms || "",
        // Itt mentjük a végösszegeket
        netTotal: data.netTotal || 0,
        vatAmount: data.vatAmount || 0,
        grossTotal: data.grossTotal || 0,
        
        // Ez a rész menti el a táblázat sorait (items)
        items: {
          create: data.items?.map((item: any) => ({
            description: item.description,
            quantity: item.quantity || 1,
            unit: item.unit || "db",
            unitPriceNet: item.unitPriceNet || 0,
            vatRate: item.vatRate || 27,
            lineNet: item.lineNet || 0,
            lineVat: item.lineVat || 0,
            lineGross: item.lineGross || 0,
            // Haszonkulcs adatok
            costNet: item.costNet || 0,
            profitAbs: item.profitAbs || 0,
            profitPct: item.profitPct || 0,
            // Itt fontos: ha a sémában van sortOrder, ide is bekerülhet:
            sortOrder: item.sortOrder || 0
          })) || []
        }
      },
      include: {
        items: true // Visszaadjuk a tételekkel együtt a választ
      }
    });

    return NextResponse.json(newQuote);
  } catch (error: any) {
    // JAVÍTVA: Konzolos log és részletes válasz
    console.error("POST API HIBA:", error); 
    return NextResponse.json({ 
      error: "Hiba az ajánlat mentésekor", 
      details: error.message,
      code: error.code 
    }, { status: 500 });
  }
}
