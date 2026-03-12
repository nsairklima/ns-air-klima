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

// POST /api/maintenance  → új karbantartás felvétele
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.unitId || !body.performedDate) {
      return Response.json(
        { error: "unitId és performedDate kötelező" },
        { status: 400 }
      );
    }

    const performed = new Date(body.performedDate);
    const nextDue =
      body.periodMonths && Number(body.periodMonths) > 0
        ? new Date(new Date(performed).setMonth(performed.getMonth() + Number(body.periodMonths)))
        : null;

    const created = await prisma.maintenanceLog.create({
      data: {
        unitId: Number(body.unitId),
        performedDate: performed,
        description: body.description ?? "",
        materials: body.materials ?? "",
        costInternal: body.costInternal ?? null,
        technicianId: body.technicianId ?? null,
        photos: body.photos ?? "",
        nextDue,
      },
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
