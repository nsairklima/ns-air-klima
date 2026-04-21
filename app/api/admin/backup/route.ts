import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

async function performBackup() {
  // 1. Adatok lekérése
  const clients = await prisma.client.findMany({
    include: { 
      units: { 
        include: { 
          maintenance: true 
        } 
      } 
    }
  });

  let inventory = [];
  try {
    inventory = await (prisma as any).item.findMany();
  } catch (e) {
    console.log("Raktár tábla kihagyva.");
  }

  const backupData = {
    timestamp: new Date().toLocaleString('hu-HU'),
    type: "ADATBÁZIS MENTÉS",
    data: { clients, inventory }
  };

  // 2. Email küldése - TESZT feliratok eltávolítva
  const reportDate = new Date().toLocaleDateString('hu-HU');
  const currentTime = new Date().toLocaleString('hu-HU');
  
  await resend.emails.send({
    from: "NS-AIR Rendszer <onboarding@resend.dev>",
    to: "nsair.klima@gmail.com",
    subject: `📋 Rendszerjelentés és Mentés - ${reportDate}`,
    html: `
      <div style="font-family: sans-serif; line-height: 1.6; padding: 20px; color: #333; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #2c3e50; border-bottom: 2px solid #2ecc71; padding-bottom: 10px;">NS-AIR Rendszerjelentés</h2>
        <p>Ez egy automatikusan generált biztonsági mentés és állapotjelentés.</p>
        <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><b>Időpont:</b></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${currentTime}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><b>Típus:</b></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">Teljes adatbázis mentés</td>
          </tr>
        </table>
        <p style="margin-top: 20px; font-size: 13px; color: #666;">
          A csatolt JSON fájl tartalmazza az összes ügyfél, klímaegység és raktárkészlet aktuális adatát.
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `nsair_backup_${new Date().toISOString().split('T')[0]}.json`,
        content: Buffer.from(JSON.stringify(backupData, null, 2)).toString('base64'),
      }
    ]
  });

  return { success: true, message: "Rendszerjelentés elküldve." };
}

export async function POST() {
  try {
    const result = await performBackup();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const result = await performBackup();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
