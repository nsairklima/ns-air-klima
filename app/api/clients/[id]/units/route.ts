
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } } // Az 'id' itt a clientId
) {
  try {
    const data = await req.json();
    
    const unit = await prisma.clientUnit.create({
      data: {
        clientId: Number(params.id),
        brand: data.brand,
        model: data.model,
        location: data.location,
        serialNumber: data.serialNumber,
        installation: data.installation ? new Date(data.installation) : null,
        periodMonths: Number(data.periodMonths) || 12,
        // JAVÍTÁS: Itt mentjük el a státuszt (INSTALLED vagy SERVICE_ONLY)
        status: data.status || "INSTALLED", 
        notes: data.notes
      },
    });

    return NextResponse.json(unit);
  } catch (error: any) {
    console.error("Gép mentési hiba:", error);
    return NextResponse.json({ error: "Hiba a gép mentésekor" }, { status: 500 });
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
