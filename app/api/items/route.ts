import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.item.findMany({
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newItem = await prisma.item.create({
      data: {
        name: body.name,
        price: parseFloat(body.price) || 0,
        sku: body.sku || null,
        stock: parseInt(body.stock) || 0,
        supplier: body.supplier || null,
        // Az updatedAt-et a Prisma most már automatikusan kezeli a séma miatt
      },
    });
    return NextResponse.json(newItem);
  } catch (error: any) {
    return NextResponse.json({ error: "Hiba a mentés során", details: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const updated = await prisma.item.update({
      where: { id: body.id },
      data: {
        name: body.name,
        price: parseFloat(body.price),
        sku: body.sku,
        stock: parseInt(body.stock),
        supplier: body.supplier,
      },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: "Hiba a módosítás során" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Nincs ID" }, { status: 400 });
  
  await prisma.item.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
