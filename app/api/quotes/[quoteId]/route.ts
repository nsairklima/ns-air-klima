import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// AJÁNLAT LEKÉRÉSE
export async function GET(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const id = Number(params.quoteId);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Érvénytelen azonosító" }, { status: 400 });
    }

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        client: true,
        items: {
          orderBy: { id: 'asc' } // Sorrendtartás
        },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: "Ajánlat nem található" }, { status: 404 });
    }

    return NextResponse.json(quote);
  } catch (error) {
    return NextResponse.json({ error: "Hiba a lekéréskor" }, { status: 500 });
  }
}

// AJÁNLAT FRISSÍTÉSE (Cím, státusz, feltételek)
export async function PATCH(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const id = Number(params.quoteId);
    const body = await req.json();

    const data: any = {};
    if (typeof body.title === "string") data.title = body.title;
    if (typeof body.terms === "string") data.terms = body.terms;
    if (typeof body.status === "string" && ["draft","sent","accepted","rejected"].includes(body.status)) {
      data.status = body.status;
    }

    const updated = await prisma.quote.update({ 
      where: { id }, 
      data 
    });
    
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: "Hiba a frissítéskor." }, { status: 500 });
  }
}

// AJÁNLAT TÖRLÉSE - EZ HIÁNYZOTT!
export async function DELETE(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const id = Number(params.quoteId);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Érvénytelen azonosító" }, { status: 400 });
    }

    // Tranzakció: Előbb a tételeket (items) töröljük, utána az ajánlatot
    await prisma.$transaction([
      prisma.quoteItem.deleteMany({
        where: { quoteId: id }
      }),
      prisma.quote.delete({
        where: { id }
      })
    ]);

    return NextResponse.json({ message: "Ajánlat sikeresen törölve." });
  } catch (error: any) {
    console.error("Hiba az ajánlat törlésekor:", error);
    return NextResponse.json({ error: "Hiba a törléskor: " + error.message }, { status: 500 });
  }
}
