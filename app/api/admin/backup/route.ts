import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Ügyfelek és gépek lekérése
    // Itt a 'clientUnit'-ot használjuk, mert az létezik a sémádban
    const clients = await prisma.client.findMany({
      include: {
        units: true 
      }
    });

    // 2. Raktárkészlet lekérése
    // Ha a 'prisma.item' hibát dob, megpróbáljuk elkapni
    let items = [];
    try {
      items = await prisma.item.findMany();
    } catch (e) {
      console.log("Item tábla hiba, kihagyva...");
    }

    const fullBackup = {
      timestamp: new Date().toISOString(),
      clients: clients,
      inventory: items,
      note: "NS-AIR Backup"
    };

    return new NextResponse(JSON.stringify(fullBackup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename=nsair_mentes_${new Date().toISOString().split('T')[0]}.json`,
      },
    });
  } catch (error: any) {
    console.error("Backup hiba:", error);
    return NextResponse.json({ 
      error: "Hiba a mentés során", 
      details: error.message 
    }, { status: 500 });
  }
}
