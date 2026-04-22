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
      // A sémádban performedDate van scheduledDate helyett
      date: m.performedDate ? new Date(m.performedDate).toISOString().split('T')[0] : null,
      
      // A sémádban van brand és model is a unit-on
      title: `${m.unit.client.name} - ${m.unit.brand} ${m.unit.model}`,
      
      // A sémádban description van notes helyett
      description: m.description || "Karbantartás",
      
      // Mivel a MaintenanceLog-on nincs status mező, itt egy fix értéket adunk, 
      // vagy használd a m.unit.status-t, ha az egység állapota kell
      status: "COMPLETED" 
    })).filter(e => e.date !== null);

    return NextResponse.json(events);
  } catch (error) {
    console.error("Calendar API Error:", error);
    return NextResponse.json({ error: "Hiba az adatok lekérésekor" }, { status: 500 });
  }
}
