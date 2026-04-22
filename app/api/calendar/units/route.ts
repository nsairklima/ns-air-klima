import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

// Ez a sor gondoskodik róla, hogy az új ügyfél azonnal megjelenjen a listában:
export const dynamic = 'force-dynamic';

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

    // A javított displayName szerkezet, amit írtál:
    const formattedUnits = units.map(u => ({
      id: u.id,
      displayName: `${u.client.name} | ${u.brand} - ${u.model} (${u.client.address})`
    }));

    return NextResponse.json(formattedUnits);
  } catch (error) {
    console.error("Hiba az egységek lekérésekor:", error);
    return NextResponse.json({ error: "Hiba az egységek lekérésekor" }, { status: 500 });
  }
}
