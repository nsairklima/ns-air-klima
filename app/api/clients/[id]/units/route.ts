
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = Number(params.id); // Itt vesszük át az URL-ből az ügyfél ID-t
    const data = await req.json();

    // Itt történik a mentés a Prisma-val
    const newUnit = await prisma.clientUnit.create({
      data: {
        clientId: clientId,
        brand: data.brand,
        model: data.model,
        serialNumber: data.serialNumber,
        location: data.location,
        periodMonths: 12, // Alapértelmezett 1 év
        installation: new Date(),
      },
    });

    return NextResponse.json(newUnit);
  } catch (error) {
    console.error("Hiba a gép mentésekor:", error);
    return NextResponse.json({ error: "Nem sikerült a gép mentése" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const units = await prisma.clientUnit.findMany({
      where: { clientId: Number(params.clientId) },
      orderBy: { id: "desc" },
    });
    return NextResponse.json(units);
  } catch (error) {
    return NextResponse.json({ error: "Hiba a lekéréskor" }, { status: 500 });
  }
}
