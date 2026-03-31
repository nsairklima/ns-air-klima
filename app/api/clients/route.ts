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

// ÜGYFELEK LEKÉRÉSE (Csak ez az egy GET maradjon a fájlban!)
export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { 
        name: "asc" // ABC sorrendben adja vissza az ügyfeleket
      }
    });
    return NextResponse.json(clients);
  } catch (error) {
    console.error("Lekérési hiba:", error);
    return NextResponse.json({ error: "Hiba a lekéréskor" }, { status: 500 });
  }
}
