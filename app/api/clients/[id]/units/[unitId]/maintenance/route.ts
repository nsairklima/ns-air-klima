import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string; unitId: string } }
) {
  try {
    const data = await req.json();
    const unitId = Number(params.unitId);

    const newLog = await prisma.maintenanceLog.create({
      data: {
        unitId: unitId,
        performedDate: new Date(data.performedDate),
        description: data.description,
        // Kiszámoljuk a következő esedékességet (alapértelmezett +12 hónap)
        nextDue: new Date(new Date(data.performedDate).setFullYear(new Date(data.performedDate).getFullYear() + 1))
      },
    });

    return NextResponse.json(newLog);
  } catch (error) {
    return NextResponse.json({ error: "Hiba a mentéskor" }, { status: 500 });
  }
}
