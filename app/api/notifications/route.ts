import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export async function GET() {
  try {
    // 1. ADATOK LEKÉRÉSE A MENTÉSHEZ (Minden tábla)
    const allClients = await prisma.client.findMany({
      include: { units: { include: { maintenance: true } } }
    });
    const allItems = await prisma.item.findMany();
    
    const backupData = {
      timestamp: new Date().toLocaleString('hu-HU'),
      clients: allClients,
      inventory: allItems
    };

    // 2. KARBANTARTÁSOK ELLENŐRZÉSE (A korábbi logika)
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

    // 3. EMAIL KÜLDÉSE CSATOLMÁNNYAL
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "nsair.klima@gmail.com",
        pass: process.env.EMAIL_PASSWORD, // A Google App Passwordod
      },
    });

    const reportDate = new Date().toLocaleDateString('hu-HU');

    await transporter.sendMail({
      from: '"NS-AIR Rendszer" <nsair.klima@gmail.com>',
      to: "nsair.klima@gmail.com",
      subject: `⚠️ RENDSZERJELENTÉS - ${reportDate} (${dueSoon.length} esedékes)`,
      html: `
        <h2>Napi Automatikus Jelentés</h2>
        <p>Az adatbázis állapota a mai napon: <b>${reportDate}</b></p>
        <hr>
        <p><b>Esedékes karbantartások száma:</b> ${dueSoon.length}</p>
        <p><i>A teljes adatbázis mentését csatolva találod JSON formátumban.</i></p>
      `,
      attachments: [
        {
          filename: `nsair_automata_mentes_${new Date().toISOString().split('T')[0]}.json`,
          content: JSON.stringify(backupData, null, 2),
          contentType: 'application/json'
        }
      ]
    });

    return NextResponse.json({ success: true, backedUp: true, alerted: dueSoon.length });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
