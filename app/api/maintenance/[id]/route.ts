import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/maintenance/[id] – Egy karbantartás lekérdezése ID alapján
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Érvénytelen id." }, { status: 400 });
    }

    const log = await prisma.maintenanceLog.findUnique({ where: { id } });
    if (!log) {
      return NextResponse.json({ error: "Nem található." }, { status: 404 });
    }
    return NextResponse.json(log);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Ismeretlen hiba." },
      { status: 500 }
    );
  }
}

// PATCH /api/maintenance/[id] – Karbantartási bejegyzés módosítása
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Érvénytelen id." }, { status: 400 });
    }

    const body = await req.json();
    const { performedDate, description, nextDue } = body; // A frontendről is nextDue-t várunk

    const updatedLog = await prisma.maintenanceLog.update({
      where: { id },
      data: {
        performedDate: performedDate ? new Date(performedDate) : undefined,
        description: description,
        // A sémád szerint a mező neve: nextDue
        nextDue: nextDue === null ? null : (nextDue ? new Date(nextDue) : undefined),
      },
    });

    return NextResponse.json(updatedLog);
  } catch (e: any) {
    console.error("Hiba a karbantartás frissítésekor:", e);
    return NextResponse.json(
      { error: e?.message || "Nem sikerült a módosítás." },
      { status: 500 }
    );
  }
}

// DELETE /api/maintenance/[id] – Törlés ID alapján
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Érvénytelen id." }, { status: 400 });
    }

    await prisma.maintenanceLog.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Nem sikerült törölni." },
      { status: 500 }
    );
  }
}
