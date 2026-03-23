
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ÚJ GÉP LÉTREHOZÁSA AZ ÜGYFÉLHEZ
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = Number(params.id);
    const data = await req.json();

    const newUnit = await prisma.clientUnit.create({
      data: {
        clientId: clientId,
        brand: data.brand,
        model: data.model,
        serialNumber: data.serialNumber,
        location: data.location,
        // Alapértelmezett beállítások a sémád alapján
        periodMonths: 12, 
        installation: new Date(),
      },
    });

    return NextResponse.json(newUnit);
  } catch (error) {
    console.error("Hiba a gép mentésekor:", error);
    return NextResponse.json(
      { error: "Nem sikerült menteni a gépet." },
      { status: 500 }
    );
  }
}

// GÉPEK LISTÁZÁSA (Ha külön le akarod kérni őket)
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const units = await prisma.clientUnit.findMany({
      where: { clientId: Number(params.id) },
      orderBy: { id: "desc" },
    });
    return NextResponse.json(units);
  } catch (error) {
    return NextResponse.json({ error: "Hiba a lekéréskor" }, { status: 500 });
  }
}
