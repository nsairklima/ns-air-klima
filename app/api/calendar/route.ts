import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// --- LEKÉRÉS (GET) ---
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
      
      // Mivel a MaintenanceLog-on nincs status mező, itt egy fix értéket adunk
      status: "COMPLETED" 
    })).filter(e => e.date !== null);

    return NextResponse.json(events);
  } catch (error) {
    console.error("Calendar API GET Error:", error);
    return NextResponse.json({ error: "Hiba az adatok lekérésekor" }, { status: 500 });
  }
}

// --- ÚJ BEJEGYZÉS LÉTREHOZÁSA (POST) ---
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { unitId, performedDate, description } = body;

    // Validálás: ellenőrizzük, hogy megvannak-e a szükséges adatok
    if (!unitId || !performedDate) {
      return NextResponse.json({ error: "Hiányzó adatok (unitId vagy dátum)" }, { status: 400 });
    }

    const newLog = await prisma.maintenanceLog.create({
      data: {
        unitId: parseInt(unitId),
        performedDate: new Date(performedDate),
        description: description || "Manuálisan felvitt karbantartás",
      },
      // Visszakérjük a kapcsolt adatokat is, hogy a naptár azonnal frissíthessen
      include: {
        unit: {
          include: {
            client: true
          }
        }
      }
    });

    return NextResponse.json(newLog);
  } catch (error) {
    console.error("Calendar API POST Error:", error);
    return NextResponse.json({ error: "Hiba a mentés során" }, { status: 500 });
  }
}
