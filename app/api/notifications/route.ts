import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

// A Resend kulcsodat a Vercel környezeti változói közül veszi (RESEND_API_KEY)
const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  try {
    // 1. ADATOK LEKÉRÉSE A MENTÉSHEZ
    let allClients = [];
    let allItems = [];
    
    try {
      allClients = await prisma.client.findMany({
        include: { units: { include: { maintenance: true } } }
      });
      allItems = await prisma.item.findMany();
    } catch (e) {
      console.error("Adatbázis lekérési hiba a mentésnél", e);
    }

    const backupData = {
      timestamp: new Date().toLocaleString('hu-HU'),
      clients: allClients,
      inventory: allItems
    };

    // 2. KARBANTARTÁSOK ELLENŐRZÉSE
    const today = new Date();
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(today.getDate() + 60);

    const units = await prisma.clientUnit.findMany({
      where: { status: { in: ["INSTALLED", "SERVICE_ONLY"] } },
      include: { client: true, maintenance: { orderBy: { performedDate: "desc" }, take: 1 } }
    });

    const dueSoon = units.filter(unit => {
      const lastLog = unit.maintenance[0];
      let dueDate: Date | null = null;
      if (lastLog?.nextDue) dueDate = new Date(lastLog.nextDue);
      else if (lastLog?.performedDate) {
        dueDate = new Date(lastLog.performedDate);
        dueDate.setMonth(dueDate.getMonth() + (unit.periodMonths || 12));
      } else if (unit.installation) {
        dueDate = new Date(unit.installation);
        dueDate.setMonth(dueDate.getMonth() + (unit.periodMonths || 12));
      }
      return dueDate && dueDate <= sixtyDaysFromNow;
    });

    // 3. EMAIL KÜLDÉSE RESEND-DEL (CSATOLMÁNNYAL)
    const reportDate = new Date().toLocaleDateString('hu-HU');
    
    await resend.emails.send({
      from: "NS-AIR <onboarding@resend.dev>", // Vagy a saját domain-ed, ha már beállítottad
      to: "nsair.klima@gmail.com",
      subject: `⚠️ RENDSZERJELENTÉS ÉS MENTÉS - ${reportDate}`,
      html: `
        <h2>Napi Jelentés és Biztonsági Mentés</h2>
        <p><b>Esedékes karbantartások:</b> ${dueSoon.length} db</p>
        <p>A mai napi teljes adatbázis mentést csatolva találod.</p>
        <hr>
        <p>NS-Air Rendszer</p>
      `,
      attachments: [
        {
          filename: `nsair_backup_${new Date().toISOString().split('T')[0]}.json`,
          content: Buffer.from(JSON.stringify(backupData, null, 2)).toString('base64'),
        }
      ]
    });

    return NextResponse.json({ success: true, sent: true });
  } catch (error: any) {
    console.error("Hiba:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
