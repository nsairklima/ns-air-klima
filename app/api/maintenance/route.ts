import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const units = await prisma.clientUnit.findMany({
      include: {
        client: true,
        maintenance: {
          orderBy: { performedDate: "desc" },
          take: 1
        }
      }
    });
    return NextResponse.json(units);
  } catch (error) {
    return NextResponse.json({ error: "Hiba a listázáskor" }, { status: 500 });
  }
}

// EZ A RÉSZ HIÁNYZOTT:
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { unitId, performedDate, description, nextDue } = body;

    const newLog = await prisma.maintenanceLog.create({
      data: {
        unitId: parseInt(unitId),
        performedDate: new Date(performedDate),
        description: description,
        nextDue: nextDue ? new Date(nextDue) : null, // Itt mentjük el a manuális dátumot!
      },
    });

    return NextResponse.json(newLog);
  } catch (error: any) {
    console.error("Mentési hiba:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
