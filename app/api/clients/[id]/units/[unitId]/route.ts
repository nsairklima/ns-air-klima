import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GÉP ADATAINAK ÉS KARBANTARTÁSAINAK LEKÉRÉSE
// GÉP ADATAINAK MÓDOSÍTÁSA (JAVÍTOTT)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string; unitId: string } }
) {
  try {
    const body = await req.json();
    
    // Ahelyett, hogy csak 4 mezőt emelnénk ki, 
    // engedjük át a státuszt vagy bármi mást is, ami a body-ban jön.
    const updatedUnit = await prisma.clientUnit.update({
      where: { id: Number(params.unitId) },
      data: {
        ...body // Ez mindent átvesz: brand, model, status, stb.
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
