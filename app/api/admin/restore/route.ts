import { NextResponse } from 'next/server';

const getPrisma = async () => {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
};

export async function POST(req: Request) {
  try {
    const prisma = await getPrisma();
    if (!prisma) return NextResponse.json({ error: "Database not available" }, { status: 500 });

    const body = await req.json();
    
    // Alapvető ellenőrzés, hogy valóban az NS-AIR mentés fájlja-e
    if (!body || !body.data || (!body.data.clients && !body.data.inventory)) {
      return NextResponse.json({ error: "Érvénytelen vagy sérült mentési fájl formatum!" }, { status: 400 });
    }

    const { clients, inventory } = body.data;

    // --- ADATBÁZIS TRANZAKCIÓ (Ha bármi hiba van menet közben, visszagörgeti az egészet) ---
    await prisma.$transaction(async (tx) => {
      
      // 1. RAKTÁR TÉTELEK VISSZAÁLLÍTÁSA
      if (inventory && Array.isArray(inventory)) {
        try {
          // Kitöröljük a jelenlegi raktárat, hogy tiszta lappal induljunk
          if ((tx as any).item) {
            await (tx as any).item.deleteMany({});
            for (const item of inventory) {
              await (tx as any).item.create({ data: item });
            }
          }
        } catch (e) {
          console.log("Raktár visszaállítás kihagyva vagy hiba történt.");
        }
      }

      // 2. ÜGYFELEK ÉS JÁRULÉKOS TÁBLÁK (Klíma egységek, karbantartások) VISSZAÁLLÍTÁSA
      if (clients && Array.isArray(clients)) {
        // A kapcsolatok miatt sorban kell törölni (Karbantartás -> Klíma -> Ügyfél)
        await tx.maintenance.deleteMany({});
        await tx.unit.deleteMany({});
        await tx.client.deleteMany({});

        for (const client of clients) {
          // Kivesszük a beágyazott egységeket a fő ügyfél objektumból
          const { units, ...clientData } = client;

          // Ügyfél létrehozása
          const createdClient = await tx.client.create({ data: clientData });

          if (units && Array.isArray(units)) {
            for (const unit of units) {
              const { maintenance, ...unitData } = unit;
              
              // Klíma egység létrehozása a szülő ügyfélhez kapcsolva
              const createdUnit = await tx.unit.create({
                data: { ...unitData, clientId: createdClient.id }
              });

              if (maintenance && Array.isArray(maintenance)) {
                for (const maint of maintenance) {
                  // Karbantartás létrehozása a klímához kapcsolva
                  await tx.maintenance.create({
                    data: { ...maint, unitId: createdUnit.id }
                  });
                }
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ success: true, message: "Az adatbázis sikeresen visszaállítva!" });
  } catch (error: any) {
    console.error("Restore error:", error);
    return NextResponse.json({ error: error.message || "Hiba a visszaállítás során." }, { status: 500 });
  }
}
