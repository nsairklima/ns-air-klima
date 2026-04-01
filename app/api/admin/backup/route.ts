import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  try {
    // 1. Összes adat lekérése a mentéshez
    const clients = await prisma.client.findMany({
      include: { units: { include: { maintenance: true } } }
    });

    // Raktárkészlet lekérése hibatűréssel (ha az Item tábla még mindig items-ként keresné)
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
    
    await resend.emails.send({
      from: "NS-AIR <onboarding@resend.dev>",
      to: "nsair.klima@gmail.com",
      subject: `💾 MANUÁLIS BIZTONSÁGI MENTÉS - ${reportDate}`,
      html: `
        <h2>NS-AIR Manuális Mentés</h2>
        <p>A mentés sikeresen elkészült a gomb megnyomásakor.</p>
        <p>Időpont: <b>${new Date().toLocaleString('hu-HU')}</b></p>
        <hr>
        <p>A mentési fájlt (.json) csatolva találod.</p>
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
