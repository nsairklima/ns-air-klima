import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseSerials(serialString: string | null): { sn: string; src: string }[] {
  if (!serialString) return [];
  return serialString
    .split(", ")
    .filter(Boolean)
    .map((raw) => {
      const [sn, src] = raw.split("@");
      return { sn: sn?.trim() || "", src: src?.trim() || "" };
    });
}

function serializeSerials(serialsArr: { sn: string; src: string }[]): string | null {
  if (serialsArr.length === 0) return null;
  return serialsArr.map((item) => `${item.sn}@${item.src}`).join(", ");
}

export async function GET() {
  try {
    const items = await prisma.item.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: "Hiba a termékek lekérésekor" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let serialsList: { sn: string; src: string }[] = [];

    if (body.newSerial?.trim()) {
      serialsList.push({
        sn: body.newSerial.trim(),
        src: body.newSupplier?.trim() || body.supplier?.trim() || "Ismeretlen",
      });
    }

    const finalStock = serialsList.length > 0 ? serialsList.length : (parseInt(body.stock) || 0);

    const newItem = await prisma.item.create({
      data: {
        brand: body.brand || null,
        name: body.name,
        price: parseFloat(body.price) || 0,
        sku: body.sku || null,
        serialNumber: serializeSerials(serialsList),
        stock: finalStock,
        supplier: body.supplier || null,
      },
    });
    return NextResponse.json(newItem);
  } catch (error: any) {
    console.error("Hiba a POST során:", error);
    return NextResponse.json({ error: "Hiba a mentés során" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { action, id, newSerial, newSupplier, deleteSerial, qtyToDeduct } = body;

    const currentItem = await prisma.item.findUnique({ where: { id: Number(id) } });
    if (!currentItem) return NextResponse.json({ error: "Termék nem található" }, { status: 404 });

    let serials = parseSerials(currentItem.serialNumber);

    if (action === "add_serial") {
      if (newSerial?.trim()) {
        serials.push({
          sn: newSerial.trim(),
          src: newSupplier?.trim() || currentItem.supplier || "Ismeretlen",
        });
      }
      const newStock = serials.length > 0 ? serials.length : ((currentItem.stock || 0) + (parseInt(body.stock) || 0));

      const updated = await prisma.item.update({
        where: { id: Number(id) },
        data: {
          serialNumber: serializeSerials(serials),
          stock: newStock,
        },
      });
      return NextResponse.json(updated);
    }

    if (action === "delete_serial") {
      serials = serials.filter((s) => s.sn !== deleteSerial);
      const newStock = currentItem.serialNumber ? serials.length : Math.max(0, (currentItem.stock || 0) - 1);

      const updated = await prisma.item.update({
        where: { id: Number(id) },
        data: {
          serialNumber: serializeSerials(serials),
          stock: newStock,
        },
      });
      return NextResponse.json(updated);
    }

    if (action === "deduct") {
      if (deleteSerial) {
        const found = serials.find((s) => s.sn === deleteSerial);
        serials = serials.filter((s) => s.sn !== deleteSerial);

        const updated = await prisma.item.update({
          where: { id: Number(id) },
          data: {
            serialNumber: serializeSerials(serials),
            stock: serials.length,
          },
        });
        return NextResponse.json({ updated, deductedSource: found ? found.src : "Ismeretlen" });
      } else {
        const newStock = Math.max(0, (currentItem.stock || 0) - (qtyToDeduct || 1));
        const updated = await prisma.item.update({ where: { id: Number(id) }, data: { stock: newStock } });
        return NextResponse.json(updated);
      }
    }

    // 4. MÓDOSÍTÁS/SZERKESZTÉS LEKEZELÉSE
    const updated = await prisma.item.update({
      where: { id: Number(id) },
      data: {
        brand: body.brand !== undefined ? (body.brand || null) : currentItem.brand,
        name: body.name !== undefined ? body.name : currentItem.name,
        price: body.price !== undefined ? parseFloat(body.price) || 0 : currentItem.price,
        sku: body.sku !== undefined ? (body.sku || null) : currentItem.sku,
        supplier: body.supplier !== undefined ? (body.supplier || null) : currentItem.supplier,
        stock: body.stock !== undefined ? Number(body.stock) : currentItem.stock,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Hiba a PATCH során:", error);
    return NextResponse.json({ error: "Hiba a frissítés során" }, { status: 500 });
  }
}

// 5. TERMÉK VÉGLEGES TÖRLÉSE
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Hiányzó azonosító (ID)" }, { status: 400 });
    }

    await prisma.item.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true, message: "Termék sikeresen törölve" });
  } catch (error: any) {
    console.error("Hiba a DELETE során:", error);
    return NextResponse.json({ error: "Hiba a törlés során" }, { status: 500 });
  }
}
