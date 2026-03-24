import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// EGY SPECIFIKUS KARBANTARTÁS TÖRLÉSE ID ALAPJÁN
export async function DELETE(
  req: Request,
  { params }: { params: { logId: string } }
) {
  try {
    const id = Number(params.logId);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Érvénytelen azonosító" }, { status: 400 });
    }

    await prisma.maintenanceLog.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Törölve" });
  } catch (error: any) {
    console.error("Hiba a törlésnél:", error);
    return NextResponse.json({ error: "Szerver hiba a törléskor" }, { status: 500 });
  }
}
