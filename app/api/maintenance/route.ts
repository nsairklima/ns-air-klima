import { prisma } from "@/lib/prisma";

// GET /api/maintenance?unitId=123
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const unitIdParam = searchParams.get("unitId");
    if (!unitIdParam) {
      return Response.json({ error: "Hiányzó unitId paraméter." }, { status: 400 });
    }
    const unitId = Number(unitIdParam);

    const logs = await prisma.maintenanceLog.findMany({
      where: { clientUnitId: unitId },
      orderBy: { performedAt: "desc" },
    });

    return Response.json(logs);
  } catch (_err) {
    return Response.json(
      { error: "Hiba történt a karbantartások lekérdezésekor." },
      { status: 500 }
    );
  }
}

// POST /api/maintenance
// Body elfogadja: performedAt VAGY performedDate (YYYY-MM-DD), notes (opcionális)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const unitId = Number(body.unitId);

    // Elfogadunk két kulcsnevet is a dátumra: performedAt vagy performedDate
    const performedStrRaw = String(body.performedAt ?? body.performedDate ?? "").trim();
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
        clientUnitId: unitId,
        performedAt,
        nextDue,
        notes,
      },
    });

    return Response.json(created, { status: 201 });
  } catch (_err) {
    return Response.json(
      { error: "Hiba történt a karbantartás mentésekor." },
      { status: 500 }
    );
  }
}

function addMonths(date: Date, months: number) {
  const d = new Date(date.getTime());
  const targetMonth = d.getMonth() + months;
  d.setMonth(targetMonth);
  // hónapvégi korrekció (pl. jan 31 + 1 hó)
  if (d.getMonth() !== (targetMonth % 12 + 12) % 12) {
    d.setDate(0);
  }
  return d;
}
``
