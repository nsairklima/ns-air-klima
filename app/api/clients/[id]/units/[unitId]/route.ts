import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// --- GÉP ADATAINAK ÉS KARBANTARTÁSAINAK LEKÉRÉSE ---
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

// --- GÉP ADATAINAK MÓDOSÍTÁSA (JAVÍTOTT, EGYETLEN VERZIÓ) ---
export async function PATCH(
  req: Request,
  { params }: { params: { id: string; unitId: string } }
) {
  try {
    const body = await req.json();
    
    // A ...body segítségével a status, brand, model stb. mind bekerül az update-be
    const updatedUnit = await prisma.clientUnit.update({
      where: { id: Number(params.unitId) },
      data: {
        ...body 
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

// --- GÉP TÖRLÉSE ---
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; unitId: string } }
) {
  try {
    await prisma.clientUnit.delete({
      where: { id: Number(params.unitId) },
    });
    return NextResponse.json({ message: "Gép törölve" });
  } catch (error) {
    console.error("Hiba a gép törlésekor:", error);
    return NextResponse.json({ error: "Hiba a törléskor" }, { status: 500 });
  }
}
