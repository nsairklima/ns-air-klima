import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Itt a prisma.item-et használjuk, mert a sémában model Item van
    const items = await prisma.item.findMany();
    return NextResponse.json(items);
  } catch (e: any) {
    console.error("Lekérési hiba:", e);
    return NextResponse.json({ 
      error: "Adatbázis hiba", 
      details: e.message,
      code: e.code 
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newItem = await prisma.item.create({
      data: {
        name: body.name,
        price: Number(body.price) || 0,
        unit: "db"
      }
    });
    return NextResponse.json(newItem);
  } catch (e: any) {
    console.error("Mentési hiba:", e);
    return NextResponse.json({ 
      error: "Mentési hiba", 
      details: e.message 
    }, { status: 500 });
  }
}
