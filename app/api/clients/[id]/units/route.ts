import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ÚJ GÉP LÉTREHOZÁSA ÉS HOZZÁRENDELÉSE AZ ÜGYFÉLHEZ
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await req.json();
    
    const unit = await prisma.clientUnit.create({
      data: {
        clientId: Number(params.id),
        brand: data.brand || "Ismeretlen",
        model: data.model || "Ismeretlen",
        location: data.location || "Nincs megadva",
        serialNumber: data.serialNumber || "Nincs gyári szám",
        installation: data.installation ? new Date(data.installation) : null,
        periodMonths: Number(data.periodMonths) || 12,
        status: data.status || "INSTALLED", 
        notes: data.notes || null // Ide fog bekerülni a "Beszerzési forrás: ..." szöveg automatikusan
      },
    });

    return NextResponse.json(unit);
  } catch (error: any) {
    console.error("Gép mentési hiba:", error);
    return NextResponse.json({ error: "Hiba a gép mentésekor", details: error.message }, { status: 500 });
  }
}

// ÜGYFÉL GÉPEINEK LEKÉRÉSE
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
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
