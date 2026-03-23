import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 });
  }
}
