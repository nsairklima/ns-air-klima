import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ÚJ GÉP LÉTREHOZÁSA
export async function POST(
  req: Request,
  { params }: { params: { id: string } } // Az 'id' a mappaszerkezeted alapján a clientId
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
        // Mentjük a státuszt (INSTALLED vagy SERVICE_ONLY)
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

// ÜGYFÉL GÉPEINEK LEKÉRÉSE
export async function GET(
  req: Request,
  { params }: { params: { id: string } } // Itt is 'id'-t használunk a mappa neve alapján
) {
  try {
    const units = await prisma.clientUnit.findMany({
      where: { clientId: Number(params.id) },
      orderBy: { id: "desc" },
      include: {
        maintenance: {
          orderBy: { performedDate: "desc" },
          take: 1
        }
      }
    });
    return NextResponse.json(units);
  } catch (error) {
    console.error("Lekérési hiba:", error);
    return NextResponse.json({ error: "Hiba a lekéréskor" }, { status: 500 });
  }
}
