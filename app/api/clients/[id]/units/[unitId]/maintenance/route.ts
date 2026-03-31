import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ÚJ KARBANTARTÁS RÖGZÍTÉSE
export async function POST(
  req: Request,
  { params }: { params: { id: string; unitId: string } }
) {
  try {
    const data = await req.json();
    const unitId = parseInt(params.unitId);

    if (isNaN(unitId)) {
      return NextResponse.json({ error: "Érvénytelen gép azonosító" }, { status: 400 });
    }

    const newLog = await prisma.maintenanceLog.create({
      data: {
        unitId: unitId,
        performedDate: new Date(data.performedDate),
        description: data.description || "",
        nextDue: data.nextDue ? new Date(data.nextDue) : null,
        // Ha van technikus azonosítód, ide jöhet, de a sémád szerint opcionális
      },
    });

    return NextResponse.json(newLog);
  } catch (error) {
    console.error("Hiba a karbantartás rögzítésekor:", error);
    return NextResponse.json({ error: "Sikertelen mentés az adatbázisba" }, { status: 500 });
  }
}

// NAPLÓ LEKÉRÉSE (Ha a főoldalról nem jönne át az összes adat)
export async function GET(
  req: Request,
  { params }: { params: { unitId: string } }
) {
  try {
    const logs = await prisma.maintenanceLog.findMany({
      where: { unitId: parseInt(params.unitId) },
      orderBy: { performedDate: "desc" },
    });
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: "Hiba a lekéréskor" }, { status: 500 });
  }
}
