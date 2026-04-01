import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Minden tábla tartalmának lekérése
    const clients = await prisma.client.findMany({
      include: {
        units: {
          include: {
            maintenance: true
          }
        }
      }
    });

    const items = await prisma.item.findMany();
    const quotes = await prisma.quote.findMany({
        include: { items: true }
    });

    const fullBackup = {
      timestamp: new Date().toISOString(),
      clients,
      inventory: items,
      quotes
    };

    return new NextResponse(JSON.stringify(fullBackup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename=nsair_teljes_mentes_${new Date().toISOString().split('T')[0]}.json`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
