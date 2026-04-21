import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Átírva GET-ről POST-ra, hogy megakadályozzuk a böngésző általi duplikált hívásokat
export async function POST() {
  try {
    // 1. Összes adat lekérése a mentéshez
    const clients = await prisma.client.findMany({
      include: { 
        units: { 
          include: { 
            maintenance: true 
          } 
        } 
      }
    });

    // Raktárkészlet lekérése hibatűréssel
    let inventory = [];
    try {
      inventory = await (prisma as any).item.findMany();
    } catch (e) {
      console.log("Item tábla hiba a manuális mentésnél, kihagyva.");
    }

    const backupData = {
      timestamp: new Date().toLocaleString('hu-HU'),
      type: "MANUÁLIS MENTÉS",
      data: {
        clients,
        inventory
      }
    };

    // 2. Küldés emailben Resend-del
    const reportDate = new Date().toLocaleDateString('hu-HU');
    const currentTime = new Date().toLocaleString('hu-HU');
    
    await resend.emails.send({
      from: "NS-AIR <onboarding@resend.dev>",
      to: "nsair.klima@gmail.com",
      subject: `💾 MANUÁLIS BIZTONSÁGI MENTÉS - ${reportDate}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6;">
          <h2 style="color: #2ecc71;">NS-AIR Manuális Mentés</h2>
          <p>A mentés sikeresen elkészült a gomb megnyomásakor.</p>
          <p>Időpont: <b>${currentTime}</b></p>
          <hr style="border: 0; border-top: 1px solid #eee;">
          <p style="color: #666;">A mentési fájlt (.json) csatolva találod a levélben.</p>
        </div>
      `,
      attachments: [
        {
          filename: `nsair_manualis_mentes_${new Date().toISOString().split('T')[0]}.json`,
          content: Buffer.from(JSON.stringify(backupData, null, 2)).toString('base64'),
        }
      ]
    });

    // 3. Visszajelzés a gombnak, hogy minden OK
    return NextResponse.json({ 
      success: true, 
      message: "A mentést elküldtük az email címedre!" 
    });

  } catch (error: any) {
    console.error("Backup hiba:", error);
    return NextResponse.json(
      { error: "Hiba történt a mentés során: " + error.message }, 
      { status: 500 }
    );
  }
}
