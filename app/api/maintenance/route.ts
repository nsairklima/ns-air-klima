import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Lekérjük azokat a gépeket, ahol a legutóbbi karbantartás régebbi, mint 11 hónap
    // Vagy ahol még sosem volt karbantartás, de a telepítés óta eltelt 1 év
    const units = await prisma.clientUnit.findMany({
      include: {
        client: true,
        maintenance: {
          orderBy: { performedDate: "desc" },
          take: 1
        }
      }
    });

    // Itt szűrhetnénk dátumra, de kezdésnek küldjük el az összeset, 
    // ahol látszik a kliens és a gép.
    return NextResponse.json(units);
  } catch (error) {
    return NextResponse.json({ error: "Hiba a listázáskor" }, { status: 500 });
  }
}
