import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export async function GET() {
  try {
    // --- 1. ADATOK LEKÉRÉSE A MENTÉSHEZ ---
    let allClients = [];
    let allItems = [];
    let backupErrors = [];

    // Ügyfelek lekérése (biztonsági blokkban)
    try {
      allClients = await prisma.client.findMany({
        include: { units: { include: { maintenance: true } } }
      });
    } catch (e: any) {
      backupErrors.push("Ügyfél tábla hiba: " + e.message);
    }

    // Raktárkészlet lekérése (külön blokkban, hogy ne rontsa el az egészet!)
    try {
      // Itt a prisma.item-et hívjuk, de ha a Prisma 'items'-et keresne és elszállna, elkapjuk a hibát
      allItems = await prisma.item.findMany();
    } catch (e: any) {
      console.error("Raktár lekérési hiba:", e.message);
      backupErrors.push("Raktár tábla hiba (Item): " + e.message);
    }
    
    const backupData = {
      timestamp: new Date().toLocaleString('hu-HU'),
      clients: allClients,
      inventory: allItems,
      errors: backupErrors.length > 0 ? backupErrors : undefined
    };

    // --- 2. KARBANTARTÁSOK ELLENŐRZÉSE ---
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

    // --- 3. EMAIL KÜLDÉSE CSATOLMÁNNYAL ---
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "nsair.klima@gmail.com",
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const reportDate = new Date().toLocaleDateString('hu-HU');

    await transporter.sendMail({
      from: '"NS-AIR Rendszer" <nsair.klima@gmail.com>',
      to: "nsair.klima@gmail.com",
      subject: `⚠️ RENDSZERJELENTÉS - ${reportDate} (${dueSoon.length} esedékes)`,
      html: `
        <h2>Napi Automatikus Jelentés és Mentés</h2>
        <p>Dátum: <b>${reportDate}</b></p>
        <hr>
        <p><b>Esedékes karbantartások:</b> ${dueSoon.length} db</p>
        ${backupErrors.length > 0 ? `<p style="color: red;">⚠️ <b>Figyelem:</b> A raktárkészletet nem sikerült kimenteni (táblahiba), de az ügyféladatok a csatolmányban vannak!</p>` : `<p style="color: green;">✅ A teljes mentés sikeres.</p>`}
        <br>
        <p><i>A biztonsági mentés (.json) az email mellékleteként érkezett.</i></p>
      `,
      attachments: [
        {
          filename: `nsair_mentes_${new Date().toISOString().split('T')[0]}.json`,
          content: JSON.stringify(backupData, null, 2),
          contentType: 'application/json'
        }
      ]
    });

    return NextResponse.json({ 
      success: true, 
      backedUp: true, 
      itemTableError: backupErrors.length > 0 
    });

  } catch (error: any) {
    console.error("Kritikus hiba:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
