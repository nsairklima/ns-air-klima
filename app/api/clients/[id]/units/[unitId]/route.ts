import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GÉP ADATAINAK ÉS KARBANTARTÁSAINAK LEKÉRÉSE
export async function GET(
  req: Request,
  { params }: { params: { id: string; unitId: string } }
) {
  try {
    const unit = await prisma.clientUnit.findUnique({
      where: { id: Number(params.unitId) },
      include: {
        maintenance: {
          orderBy: { performedDate: "desc" }
        }
      }
    });

    if (!unit) return NextResponse.json({ error: "Gép nem található" }, { status: 404 });

    return NextResponse.json(unit);
  } catch (error) {
    console.error("Hiba a gép lekérésekor:", error);
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 });
  }
}

// GÉP ADATAINAK MÓDOSÍTÁSA
export async function PATCH(
  req: Request,
  { params }: { params: { id: string; unitId: string } }
) {
  try {
    const body = await req.json();
    const { brand, model, serialNumber, location } = body;

    const updatedUnit = await prisma.clientUnit.update({
      where: { id: Number(params.unitId) },
      data: {
        brand,
        model,
        serialNumber,
        location,
      },
    });

    return NextResponse.json(updatedUnit);
  } catch (error: any) {
    console.error("Hiba a gép frissítésekor:", error);
    return NextResponse.json(
      { error: "Hiba a módosítás mentésekor: " + error.message },
      { status: 500 }
    );
  }
}

// GÉP TÖRLÉSE
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; unitId: string } }
) {
  try {
    // Itt érdemes megjegyezni: ha a Prisma sémában nincs 'onDelete: Cascade', 
    // a karbantartási naplókat előbb törölni kell, de általában a gép törlése 
    // magával rántja azokat a helyes relációk esetén.
    await prisma.clientUnit.delete({
      where: { id: Number(params.unitId) },
    });
    return NextResponse.json({ message: "Gép törölve" });
  } catch (error) {
    console.error("Hiba a gép törlésekor:", error);
    return NextResponse.json({ error: "Hiba a törléskor" }, { status: 500 });
  }
}
