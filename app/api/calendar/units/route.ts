import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const units = await prisma.clientUnit.findMany({
      include: {
        client: true
      },
      orderBy: {
        client: { name: 'asc' }
      }
    });

    // Úgy formázzuk, hogy könnyű legyen megjeleníteni: "Ügyfél neve - Gép típusa"
    const formattedUnits = units.map(u => ({
      id: u.id,
      displayName: `${u.client.name} | ${u.brand} (${u.address || u.client.address})`
    }));

    return NextResponse.json(formattedUnits);
  } catch (error) {
    return NextResponse.json({ error: "Hiba az egységek lekérésekor" }, { status: 500 });
  }
}
