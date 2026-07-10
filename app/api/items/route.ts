import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Segédfüggvény: string-ből tömbbé alakít [ {sn, src}, ... ]
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

// Segédfüggvény: tömbből vissza stringgé adatbázis mentéshez
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

    // Ha az első rögzítéskor adnak meg gyári számot
    if (body.newSerial?.trim()) {
      serialsList.push({
        sn: body.newSerial.trim(),
        src: body.newSupplier?.trim() || body.supplier?.trim() || "Ismeretlen"
      });
    }

    const finalStock = serialsList.length > 0 ? serialsList.length : (parseInt(body.stock) || 0);

    const newItem = await prisma.item.create({
      data: {
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

    // 1. UTASÍTÁS: ÚJ GYÁRI SZÁM HOZZÁADÁSA (BEVÉTELEZÉS)
    if (action === "add_serial") {
      if (newSerial?.trim()) {
        serials.push({
          sn: newSerial.trim(),
          src: newSupplier?.trim() || currentItem.supplier || "Ismeretlen"
        });
      }
      const newStock = serials.length > 0 ? serials.length : ((currentItem.stock || 0) + (parseInt(body.stock) || 0));
      
      const updated = await prisma.item.update({
        where: { id },
        data: {
          serialNumber: serializeSerials(serials),
          stock: newStock
        }
      });
      return NextResponse.json(updated);
    }

    // 2. UTASÍTÁS: KÉZI TÖRLÉS LENYÍLÓBÓL (SELEJTEZÉS / JAVÍTÁS)
    if (action === "delete_serial") {
      serials = serials.filter(s => s.sn !== deleteSerial);
      const newStock = currentItem.serialNumber ? serials.length : Math.max(0, (currentItem.stock || 0) - 1);

      const updated = await prisma.item.update({
        where: { id },
        data: {
          serialNumber: serializeSerials(serials),
          stock: newStock
        }
      });
      return NextResponse.json(updated);
    }

    // 3. UTASÍTÁS: ÜGYFÉLNEK ELADVA (AUTOMATIKUS LEVONÁS)
    if (action === "deduct") {
      if (deleteSerial) {
        // Megkeressük a törlendő gyári számot, hogy lássuk a forrását
        const found = serials.find(s => s.sn === deleteSerial);
        serials = serials.filter(s => s.sn !== deleteSerial);
        
        const updated = await prisma.item.update({
          where: { id },
          data: {
            serialNumber: serializeSerials(serials),
            stock: serials.length
          }
        });
        // Visszaadjuk a forrást is, hogy az ügyfél oldal elmenthesse magának!
        return NextResponse.json({ updated, deductedSource: found ? found.src : "Ismeretlen" });
      } else {
        // Gyári szám nélküli anyag (pl. cső) sima levonása
        const newStock = Math.max(0, (currentItem.stock || 0) - (qtyToDeduct || 1));
        const updated = await prisma.item.update({ where: { id }, data: { stock: newStock } });
        return NextResponse.json(updated);
      }
    }

    // SIMA MENEDZSMENT SZERKESZTÉS (Ár, név módosítása)
    const updated = await prisma.item.update({
      where: { id },
      data: {
        name: body.name,
        price: parseFloat(body.price),
        sku: body.sku,
        supplier: body.supplier
      },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: "Hiba a frissítés során" }, { status: 500 });
  }
}
