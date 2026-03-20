import { prisma } from "@/lib/prisma";

// GET /api/maintenance?unitId=123 → adott klíma naplójának listája
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get("unitId");
    const where = unitId ? { unitId: Number(unitId) } : undefined;

    const list = await prisma.maintenanceLog.findMany({
      where,
      orderBy: { performedDate: "desc" },
    });

    return Response.json(list);
  } catch (error) {
    console.error("GET /api/maintenance error:", error);
    return Response.json(
      { error: "Hiba történt a karbantartások lekérésekor." },
      { status: 500 }
    );
  }
}

// POST /api/maintenance → új karbantartás felvétele

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const unitId = Number(body.unitId);

    // Elfogadjuk bármelyik kulcsot:
    const performedStrRaw =
      (body.performedAt ?? body.performedDate ?? "").toString().trim();

    const notes = body.notes ? String(body.notes) : null;

    if (!unitId || !performedStrRaw) {
      return Response.json(
        { error: "A unitId és a dátum kötelező." },
        { status: 400 }
      );
    }

    const unit = await prisma.clientUnit.findUnique({ where: { id: unitId } });
    if (!unit) {
      return Response.json(
        { error: "A megadott klíma (unit) nem létezik." },
        { status: 404 }
      );
    }

    // Dátum parse (YYYY-MM-DD)
    const performedAt = new Date(performedStrRaw);
    if (isNaN(performedAt.getTime())) {
      return Response.json(
        { error: "A dátum formátuma érvénytelen. (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const months = unit.periodMonths || 12;
    const nextDue = addMonths(performedAt, months);

    const created = await prisma.maintenanceLog.create({
      data: {
        clientUnitId: unitId, // ha nálad a mező neve 'unitId', akkor ezt írd át arra
        performedAt,          // ha a sémádban 'performedDate' a mező neve, írd át arra
        nextDue,
        notes,
      },
    });

    return Response.json(created, { status: 201 });
  } catch (err) {
    return Response.json(
      { error: "Hiba történt a karbantartás mentésekor." },
      { status: 500 }
    );

    });

    return Response.json(created);
  } catch (error) {
    console.error("POST /api/maintenance error:", error);
    return Response.json(
      { error: "Hiba történt új karbantartás létrehozásakor." },
      { status: 500 }
    );
  }
}
