import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Lekérjük a karbantartásokat az ügyfél nevével együtt
    const maintenances = await prisma.maintenanceLog.findMany({
      include: {
        unit: {
          include: {
            client: true
          }
        }
      }
    });

    // Formázzuk a naptár számára emészthető formátumba
    const events = maintenances.map(m => ({
      id: m.id,
      date: m.scheduledDate ? new Date(m.scheduledDate).toISOString().split('T')[0] : null,
      title: `${m.unit.client.name} - ${m.unit.model || 'Klíma'}`,
      description: m.notes || "Karbantartás",
      status: m.status
    })).filter(e => e.date !== null);

    return NextResponse.json(events);
  } catch (error) {
    return NextResponse.json({ error: "Hiba az adatok lekérésekor" }, { status: 500 });
  }
}
