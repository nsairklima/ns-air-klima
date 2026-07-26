import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // vagy ahogy az adatbázis-kapcsolatod be van kötve

// GET: Raktárkészlet lekérése
export async function GET() {
  try {
    const items = await prisma.item.findMany({
      orderBy: { id: "desc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: "Hiba a raktár lekérésekor" }, { status: 500 });
  }
}

// POST: Új termék létrehozása
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { brand, name, price, sku, supplier, unit } = body;

    const newItem = await prisma.item.create({
      data: {
        brand: brand || "",
        name: name || "",
        price: Number(price) || 0,
        sku: sku || "",
        supplier: supplier || "",
        unit: unit || "db", // <-- Itt kimentjük a mértékegységet (m vagy db)
        stock: 0,
      },
    });

    return NextResponse.json(newItem);
  } catch (error) {
    console.error("POST hiba:", error);
    return NextResponse.json({ error: "Hiba az új termék létrehozásakor" }, { status: 500 });
  }
}

// PATCH: Módosítás (szerkesztés vagy készlet/gyári szám hozzáadás)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { action, id } = body;

    if (!id) {
      return NextResponse.json({ error: "Hiányzó azonosító (id)" }, { status: 400 });
    }

    // 1. Termék adatainak szerkesztése
    if (action === "update_details") {
      const { brand, name, price, sku, supplier, stock, unit } = body;

      const updatedItem = await prisma.item.update({
        where: { id: Number(id) },
        data: {
          brand: brand || "",
          name: name || "",
          price: Number(price) || 0,
          sku: sku || "",
          supplier: supplier || "",
          stock: Number(stock) || 0,
          unit: unit || "db", // <-- Itt frissítjük a mértékegységet
        },
      });

      return NextResponse.json(updatedItem);
    }

    // 2. Gyári szám / mennyiség hozzáadása
    if (action === "add_serial") {
      const { newSerial, newSupplier, stock } = body;
      const currentItem = await prisma.item.findUnique({ where: { id: Number(id) } });

      if (!currentItem) {
        return NextResponse.json({ error: "Termék nem található" }, { status: 404 });
      }

      let updatedSerials = currentItem.serialNumber || "";
      let newStock = currentItem.stock || 0;

      if (newSerial && newSerial.trim() !== "") {
        const src = newSupplier && newSupplier.trim() !== "" ? newSupplier.trim() : (currentItem.supplier || "Nincs");
        const entry = `${newSerial.trim()}@${src}`;
        updatedSerials = updatedSerials ? `${updatedSerials}, ${entry}` : entry;
        
        // Ha van gyári szám, a darabszámot a gyári számok száma alapján frissítjük
        const serialCount = updatedSerials.split(", ").filter(Boolean).length;
        newStock = serialCount;
      } else {
        // Gyári szám nélküli terméknél (pl. méterben mért rézcső) hozzáadjuk a megadott mennyiséget
        newStock += Number(stock) || 0;
      }

      const updatedItem = await prisma.item.update({
        where: { id: Number(id) },
        data: {
          serialNumber: updatedSerials,
          stock: newStock,
        },
      });

      return NextResponse.json(updatedItem);
    }

    // 3. Gyári szám törlése
    if (action === "delete_serial") {
      const { deleteSerial } = body;
      const currentItem = await prisma.item.findUnique({ where: { id: Number(id) } });

      if (!currentItem || !currentItem.serialNumber) {
        return NextResponse.json({ error: "Termék vagy gyári szám nem található" }, { status: 404 });
      }

      const serialArray = currentItem.serialNumber.split(", ").filter(Boolean);
      const filteredSerials = serialArray.filter((s) => {
        const [sn] = s.split("@");
        return sn?.trim() !== deleteSerial?.trim();
      });

      const updatedSerialsString = filteredSerials.join(", ");

      const updatedItem = await prisma.item.update({
        where: { id: Number(id) },
        data: {
          serialNumber: updatedSerialsString,
          stock: filteredSerials.length,
        },
      });

      return NextResponse.json(updatedItem);
    }

    return NextResponse.json({ error: "Ismeretlen akció" }, { status: 400 });
  } catch (error) {
    console.error("PATCH hiba:", error);
    return NextResponse.json({ error: "Hiba a frissítés során" }, { status: 500 });
  }
}
