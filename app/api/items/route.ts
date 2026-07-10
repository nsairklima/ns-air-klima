import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Formázza és tisztítja a gyári számokat
function formatSerialNumbers(snString: string, defaultSupplier: string): string {
  if (!snString) return "";
  const supplier = defaultSupplier ? defaultSupplier.trim() : "";

  return snString
    .split(",")
    .map((sn) => {
      const trimmed = sn.trim();
      if (!trimmed) return "";
      if (trimmed.includes("@")) {
        const [num, src] = trimmed.split("@");
        return `${num.trim()}@${src.trim()}`;
      }
      return supplier ? `${trimmed}@${supplier}` : trimmed;
    })
    .filter((sn) => sn.length > 0)
    .join(", ");
}

export async function GET() {
  try {
    const items = await prisma.item.findMany({
      orderBy: { name: "asc" }
    });
    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json({ error: "Hiba a termékek lekérésekor" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const formattedSN = formatSerialNumbers(body.serialNumber, body.supplier);
    const finalStock = formattedSN ? formattedSN.split(", ").length : (parseInt(body.stock) || 0);

    const newItem = await prisma.item.create({
      data: {
        name: body.name,
        price: parseFloat(body.price) || 0,
        sku: body.sku || null,
        serialNumber: formattedSN || null,
        stock: finalStock,
        supplier: body.supplier || null,
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
    const { action, id, serialNumber, supplier, qtyToDeduct } = body;

    // 1. ESET: ÜGYFÉLHEZ RENDELÉS (LEVONÁS A RAKTÁRBÓL)
    if (action === "deduct") {
      const currentItem = await prisma.item.findUnique({ where: { id } });
      if (!currentItem) return NextResponse.json({ error: "A termék nem található" }, { status: 404 });

      let currentSerials = currentItem.serialNumber ? currentItem.serialNumber.split(", ").filter(Boolean) : [];
      
      // Ha konkrét gyári számot vonunk le
      if (serialNumber) {
        // Kiszedjük azt a gyári számot, aminek a száma egyezik (levágva az @ utáni részt a kereséshez)
        currentSerials = currentSerials.filter(rawSn => {
          const [snNum] = rawSn.split("@");
          return snNum.trim() !== serialNumber.trim();
        });
      }

      // Készlet csökkentése (ha van S/N, akkor az új S/N hossza, ha nincs, sima levonás)
      const newStock = currentItem.serialNumber 
        ? currentSerials.length 
        : Math.max(0, (currentItem.stock || 0) - (qtyToDeduct || 1));

      const updated = await prisma.item.update({
        where: { id },
        data: {
          stock: newStock,
          serialNumber: currentSerials.length > 0 ? currentSerials.join(", ") : null
        }
      });
      return NextResponse.json(updated);
    }

    // 2. ESET: BEVÉTELEZÉS / HOZZÁADÁS MEGLÉVŐHÖZ
    if (action === "add_stock") {
      const currentItem = await prisma.item.findUnique({ where: { id } });
      if (!currentItem) return NextResponse.json({ error: "A termék nem található" }, { status: 404 });

      const newSerialsFormatted = formatSerialNumbers(serialNumber, supplier);
      
      let finalSerials = currentItem.serialNumber ? currentItem.serialNumber.split(", ").filter(Boolean) : [];
      if (newSerialsFormatted) {
        finalSerials = [...finalSerials, ...newSerialsFormatted.split(", ").filter(Boolean)];
      }

      const finalStock = finalSerials.length > 0 ? finalSerials.length : ((currentItem.stock || 0) + (parseInt(body.stock) || 0));

      const updated = await prisma.item.update({
        where: { id },
        data: {
          serialNumber: finalSerials.length > 0 ? finalSerials.join(", ") : null,
          stock: finalStock,
          // Ha adtak meg új fő beszállítót, frissítjük, ha nem, marad a régi
          supplier: supplier || currentItem.supplier
        }
      });
      return NextResponse.json(updated);
    }

    // 3. ESET: SIMA SZERKESZTÉS (Mentés gomb)
    const formattedSN = formatSerialNumbers(body.serialNumber, body.supplier);
    const finalStock = formattedSN ? formattedSN.split(", ").length : (parseInt(body.stock) || 0);

    const updated = await prisma.item.update({
      where: { id: body.id },
      data: {
        name: body.name,
        price: parseFloat(body.price),
        sku: body.sku,
        serialNumber: formattedSN || null,
        stock: finalStock,
        supplier: body.supplier,
      },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH hiba:", error);
    return NextResponse.json({ error: "Hiba a módosítás során", details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Nincs ID" }, { status: 400 });
    
    await prisma.item.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Hiba a törlés során", details: error.message }, { status: 500 });
  }
}
