import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Összes ajánlat lekérése
export async function GET() {
  try {
    const quotes = await prisma.quote.findMany({
      include: { client: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(quotes);
  } catch (error) {
    return NextResponse.json({ error: "Hiba a lekéréskor" }, { status: 500 });
  }
}

// Új ajánlat létrehozása
export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Itt hozzuk létre az alap ajánlatot
    const newQuote = await prisma.quote.create({
      data: {
        clientId: Number(data.clientId),
        status: "draft", // Alapértelmezett státusz: Piszkozat
        netTotal: 0,
        vatAmount: 0,
        grossTotal: 0,
        // Ha a sémádban van 'title', akkor beírjuk, ha nincs, kihagyjuk
        ...(data.title && { title: data.title }), 
      },
    });

    return NextResponse.json(newQuote);
  } catch (error) {
    console.error("Szerver oldali hiba:", error);
    return NextResponse.json({ error: "Hiba a mentéskor" }, { status: 500 });
  }
}
