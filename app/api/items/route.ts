import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ÖSSZES TÉTEL LEKÉRÉSE
export async function GET() {
  try {
    const items = await prisma.item.findMany({
      orderBy: { createdAt: 'desc' } // Legfrissebbek elöl
    });
    return NextResponse.json(items);
  } catch (e: any) {
    console.error("Lekérési hiba:", e);
    return NextResponse.json({ 
      error: "Adatbázis hiba", 
      details: e.message 
    }, { status: 500 });
  }
}

// ÚJ TÉTEL LÉTREHOZÁSA (BŐVÍTETT MEZŐKKEL)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newItem = await prisma.item.create({
      data: {
        name: body.name,
        price: Number(body.price) || 0,
        sku: body.sku || null,            // Cikkszám
        serialNumber: body.serialNumber || null, // Gyári szám
        stock: Number(body.stock) || 0,   // Készlet
        supplier: body.supplier || null,  // Nagyker
        unit: body.unit || "db"
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

// TÉTEL MÓDOSÍTÁSA (BŐVÍTETT MEZŐKKEL)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, name, price, sku, serialNumber, stock, supplier, unit } = body;

    if (!id) {
        return NextResponse.json({ error: "Hiányzó ID a módosításhoz" }, { status: 400 });
    }

    const updatedItem = await prisma.item.update({
      where: { id: Number(id) },
      data: {
        name: name,
        price: Number(price),
        sku: sku,
        serialNumber: serialNumber,
        stock: Number(stock) || 0,
        supplier: supplier,
        unit: unit || "db"
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error: any) {
    console.error("Módosítási hiba:", error);
    return NextResponse.json({ 
        error: "Sikertelen módosítás", 
        details: error.message 
    }, { status: 500 });
  }
}

// TÉTEL TÖRLÉSE
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Hiányzó ID" }, { status: 400 });
    }

    await prisma.item.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ message: "Sikeres törlés" });
  } catch (e: any) {
    console.error("Törlési hiba:", e);
    return NextResponse.json({ 
        error: "Nem sikerült a törlés", 
        details: e.message 
    }, { status: 500 });
  }
}
