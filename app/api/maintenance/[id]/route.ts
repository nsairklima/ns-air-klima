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
  } catch (err) {
    return Response.json(
      { error: "Hiba történt a karbantartások lekérdezésekor." },
      { status: 500 }
    );
  }
}

// POST /api/maintenance
// Body: { unitId: number, performedAt: string(YYYY-MM-DD), notes?: string }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const unitId = Number(body.unitId);
    const performedAtStr = String(body.performedAt || "").trim();
    const notes = body.notes ? String(body.notes) : null;

    if (!unitId || !performedAtStr) {
      return Response.json(
        { error: "A unitId és a performedAt kötelező." },
        { status: 400 }
      );
    }

    // 1) Lekérjük az egységet, hogy tudjuk a periodMonths értéket
    const unit = await prisma.clientUnit.findUnique({ where: { id: unitId } });
    if (!unit) {
      return Response.json({ error: "A megadott klíma (unit) nem létezik." }, { status: 404 });
    }

    // 2) Dátumok előkészítése
    const performedAt = new Date(performedAtStr);
    if (isNaN(performedAt.getTime())) {
      return Response.json(
        { error: "A performedAt dátum formátuma érvénytelen. (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const months = unit.periodMonths || 12;
    const nextDue = addMonths(performedAt, months);

    // 3) Mentés
    const created = await prisma.maintenanceLog.create({
      data: {
        clientUnitId: unitId,
        performedAt,
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
  }
}

function addMonths(date: Date, months: number) {
  const d = new Date(date.getTime());
  const targetMonth = d.getMonth() + months;
  d.setMonth(targetMonth);
  // Ha a hónap túlcsordult (pl. jan 31 + 1 hónap) korrigáljuk
  if (d.getMonth() !== (targetMonth % 12 + 12) % 12) {
    d.setDate(0);
  }
  return d;
}
``
