import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ÜGYFÉL LÉTREHOZÁSA
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const newClient = await prisma.client.create({
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        notes: data.notes,
      },
    });
    return NextResponse.json(newClient);
  } catch (error) {
    console.error("Mentési hiba:", error);
    return NextResponse.json({ error: "Sikertelen mentés" }, { status: 500 });
  }
}

// ÜGYFELEK LEKÉRÉSE KERESÉSSEL
export async function GET(req: Request) {
  try {
    // 1. Kinyerjük a keresési paramétert az URL-ből
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    // 2. Összeállítjuk a lekérdezést
    const clients = await prisma.client.findMany({
      where: search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },    // Keresés névben
          { address: { contains: search, mode: 'insensitive' } }, // Keresés címben
          { phone: { contains: search, mode: 'insensitive' } },   // Keresés telefonban
        ]
      } : {}, // Ha nincs keresés, üres objektumot küldünk (mindenkit lekér)
      orderBy: { 
        name: "asc" 
      }
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Lekérési hiba:", error);
    return NextResponse.json({ error: "Hiba a lekéréskor" }, { status: 500 });
  }
}
