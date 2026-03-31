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
      if (!lastLog || !lastLog.nextDue) return false;
      const dueDate = new Date(lastLog.nextDue);
      return dueDate <= sixtyDaysFromNow;
    });

    if (dueSoon.length === 0) {
      return NextResponse.json({ message: "Nincs esedékes karbantartás." });
    }

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
      const dueDate = new Date(u.maintenance[0].nextDue!);
      const dateStr = dueDate.toLocaleDateString('hu-HU');
      const isOverdue = dueDate < today;
      
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <strong style="color: #2c3e50;">${u.client.name}</strong><br>
            <span style="font-size: 12px; color: #7f8c8d;">${u.client.phone || ''}</span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; color: #2c3e50;">
            ${u.brand} ${u.model}<br>
            <span style="font-size: 12px; color: #7f8c8d;">S/N: ${u.serialNumber || '-'}</span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
            <span style="color: ${isOverdue ? '#e74c3c' : '#27ae60'}; font-weight: bold;">
              ${dateStr}
            </span><br>
            <span style="font-size: 11px; color: ${isOverdue ? '#e74c3c' : '#7f8c8d'};">
              ${isOverdue ? 'LEJÁRT!' : 'Esedékes'}
            </span>
          </td>
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
