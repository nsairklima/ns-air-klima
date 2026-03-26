import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const items = await prisma.item.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json(items, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: "Hiba a lekéréskor" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name) return NextResponse.json({ error: "Név kötelező" }, { status: 400 });
    const newItem = await prisma.item.create({
      data: { name: body.name, price: parseFloat(body.price) || 0, unit: "db" }
    });
    return NextResponse.json(newItem);
  } catch (error) {
    console.error("Mentési hiba:", error);
    return NextResponse.json({ error: "Hiba a mentéskor" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "Nincs ID" }, { status: 400 });
    await prisma.item.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Hiba a törléskor" }, { status: 500 });
  }
}
