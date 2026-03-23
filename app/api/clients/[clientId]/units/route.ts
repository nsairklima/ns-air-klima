import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { clientId: string } } // Itt most clientId-t használunk
) {
  try {
    const cId = Number(params.clientId); // Itt is clientId-t olvasunk ki
    const data = await req.json();

    const newUnit = await prisma.clientUnit.create({
      data: {
        clientId: cId,
        brand: data.brand,
        model: data.model,
        serialNumber: data.serialNumber,
        location: data.location,
        periodMonths: 12, 
        installation: new Date(),
      },
    });

    return NextResponse.json(newUnit);
  } catch (error) {
    console.error("Hiba:", error);
    return NextResponse.json({ error: "Hiba a mentéskor" }, { status: 500 });
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
    return NextResponse.json({ error: "Hiba" }, { status: 500 });
  }
}
