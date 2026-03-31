import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import nodemailer from 'nodemailer';

export async function GET(req: Request) {
  try {
    // 1. Határidő számítása (Ma + 60 nap)
    const today = new Date();
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(today.getDate() + 60);

    // 2. Adatok lekérése az adatbázisból
    const units = await prisma.clientUnit.findMany({
      include: {
        client: true,
        maintenance: {
          orderBy: { performedDate: "desc" },
          take: 1
        }
      }
    });

    // 3. Szűrés az esedékesekre
   
const dueSoon = units.filter(unit => {
  const lastLog = unit.maintenance && unit.maintenance[0];
  let dueDate: Date;

  if (lastLog?.nextDue) {
    dueDate = new Date(lastLog.nextDue);
  } else if (lastLog?.performedDate) {
    dueDate = new Date(lastLog.performedDate);
    dueDate.setMonth(dueDate.getMonth() + (unit.periodMonths || 12));
  } else if (unit.installation) {
    dueDate = new Date(unit.installation);
    dueDate.setMonth(dueDate.getMonth() + (unit.periodMonths || 12));
  } else {
    return false;
  }

  const sixtyDaysFromNow = new Date();
  sixtyDaysFromNow.setDate(new Date().getDate() + 60);

  return dueDate <= sixtyDaysFromNow;
});

    // 4. Transporter beállítása az ÚJ címmel
    const transporter = nodemailer.createTransport({
      host: "mail.nsairklima.hu",
      port: 465,
      secure: true, 
      auth: {
        user: "ajanlat@nsairklima.hu", // Módosítva
        pass: process.env.EMAIL_PASS,
      },
    });

    // 5. Táblázat összeállítása
const tableRows = dueSoon.map(u => {
  const date = u.calculatedDueDate;
  // Csak akkor formázzuk, ha érvényes dátum és nem 1970
  const dateStr = (date && date.getFullYear() > 1970) 
    ? date.toLocaleDateString('hu-HU') 
    : "Nincs megadva";
    
  const isOverdue = date && date < new Date();
  
  return `
    <tr>
      <td>${u.client.name}</td>
      <td>${u.brand} ${u.model}</td>
      <td style="color: ${isOverdue ? 'red' : 'black'}">${dateStr}</td>
    </tr>
  `;
}).join('');

    // 6. Küldés (Feladó módosítva az új címre)
    await transporter.sendMail({
      from: '"NS-AIR Rendszer" <ajanlat@nsairklima.hu>',
      to: "nsair.klima@gmail.com",
      subject: `⚠️ Karbantartási emlékeztető - ${dueSoon.length} db gép`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 12px; color: #2c3e50;">
          <h2 style="color: #3498db; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Esedékes karbantartások</h2>
          <p>A rendszer az alábbi gépeknél jelzett határidőt a következő 60 napban:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background-color: #f8f9fa; text-align: left;">
                <th style="padding: 12px; border-bottom: 2px solid #dee2e6;">Ügyfél</th>
                <th style="padding: 12px; border-bottom: 2px solid #dee2e6;">Gép adatai</th>
                <th style="padding: 12px; border-bottom: 2px solid #dee2e6; text-align: right;">Határidő</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <div style="margin-top: 30px; text-align: center;">
            <a href="https://nsairklima.vercel.app/maintenance" 
               style="background-color: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
               ÖSSZES KARBANTARTÁS MEGNYITÁSA
            </a>
          </div>

          <p style="font-size: 12px; color: #95a5a6; margin-top: 40px; text-align: center;">
            Ez egy automatikus rendszerüzenet az NS-AIR KLÍMA adatbázisából.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, count: dueSoon.length });
  } catch (error: any) {
    console.error("Hiba:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
