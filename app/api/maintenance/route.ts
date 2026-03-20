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
      where: { unitId },
      orderBy: { performedDate: "desc" },
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
// Body elfogadja: performedDate VAGY performedAt (YYYY-MM-DD)
// Opcionális: description (alias: notes), materials, costInternal, technicianId, photos
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const unitId = Number(body.unitId);

    // Dátum: fogadjuk mindkét néven (compat a korábbi UI-val)
    const performedStrRaw = String(body.performedDate ?? body.performedAt ?? "").trim();

    // Mezőtérkép a sémádhoz
    const description =
      body.description != null
        ? String(body.description)
        : body.notes != null
        ? String(body.notes)
        : null;
    const materials = body.materials != null ? String(body.materials) : null;
    const costInternal =
      body.costInternal != null && body.costInternal !== ""
        ? Number(body.costInternal)
        : null;
    const technicianId =
      body.technicianId != null && body.technicianId !== ""
        ? Number(body.technicianId)
        : null;
    const photos = body.photos != null ? String(body.photos) : null;

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
    const performedDate = new Date(performedStrRaw);
    if (isNaN(performedDate.getTime())) {
      return Response.json(
        { error: "A dátum formátuma érvénytelen. (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const months = unit.periodMonths || 12;
    const nextDue = addMonths(performedDate, months);

    const created = await prisma.maintenanceLog.create({
      data: {
        unitId,
        performedDate,
        description,   // ← a sémád szerinti mező
        materials,
        costInternal,
        technicianId,
        nextDue,
        photos,
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
