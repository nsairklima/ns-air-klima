import { prisma } from "@/lib/prisma";

// GET /api/maintenance – összes karbantartás
export async function GET() {
  try {
    const list = await prisma.maintenanceLog.findMany({
      orderBy: { performedDate: "desc" },
      include: {
        unit: {
          include: { client: true }
        }
      }
    });

    return Response.json(list);
  } catch (error) {
    return Response.json(
      { error: "Hiba történt a karbantartások lekérésekor." },
      { status: 500 }
    );
  }
}

// POST /api/maintenance – új karbantartás
export async function POST(req: Request) {
  try {
    const data = await req.json();

    // kiszámoljuk a következő esedékességet
    const nextDue = (() => {
      if (!data.performedDate || !data.periodMonths) return null;
      const d = new Date(data.performedDate);
      d.setMonth(d.getMonth() + data.periodMonths);
      return d;
    })();

    const created = await prisma.maintenanceLog.create({
      data: {
        unitId: data.unitId,
        performedDate: new Date(data.performedDate),
        description: data.description || "",
        materials: data.materials || "",
        costInternal: data.costInternal || 0,
        technicianId: data.technicianId || null,
        photos: data.photos || "",
        nextDue
      }
    });

    return Response.json(created);
  } catch (error) {
    return Response.json(
      { error: "Hiba történt új karbantartás létrehozásakor." },
      { status: 500 }
    );
  }
}
