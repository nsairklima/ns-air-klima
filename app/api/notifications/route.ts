import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import nodemailer from 'nodemailer';

export async function GET(req: Request) {
  try {
    const today = new Date();
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(today.getDate() + 60);

    const units = await prisma.clientUnit.findMany({
      include: {
        client: true,
        maintenance: {
          orderBy: { performedDate: "desc" },
          take: 1
        }
      }
    });

    // 1. Kiszámoljuk a dátumokat és szűrünk
    const dueSoon = units.map(unit => {
      const lastLog = unit.maintenance && unit.maintenance[0];
      let dueDate: Date | null = null;

      if (lastLog?.nextDue) {
        dueDate = new Date(lastLog.nextDue);
      } else if (lastLog?.performedDate) {
        dueDate = new Date(lastLog.performedDate);
        dueDate.setMonth(dueDate.getMonth() + (unit.periodMonths || 12));
      } else if (unit.installation) {
        dueDate = new Date(unit.installation);
        dueDate.setMonth(dueDate.getMonth() + (unit.periodMonths || 12));
      }

      return { ...unit, calculatedDueDate: dueDate };
    }).filter(u => {
      return u.calculatedDueDate && u.calculatedDueDate <= sixtyDaysFromNow;
    });

    if (dueSoon.length === 0) {
      return NextResponse.json({ message: "Nincs esedékes karbantartás." });
    }

    const transporter = nodemailer.createTransport({
      host: "mail.nsairklima.hu",
      port: 465,
      secure: true, 
      auth: {
        user: "ajanlat@nsairklima.hu",
        pass: process.env.EMAIL_PASS,
      },
    });

    // 2. Táblázat összeállítása (Most már a TypeScript látja a calculatedDueDate-et)
    const tableRows = dueSoon.map(u => {
      const date = u.calculatedDueDate as Date; // Jelezzük a TS-nek, hogy itt már biztosan van dátum
      const dateStr = (date && date.getFullYear() > 1970) 
        ? date.toLocaleDateString('hu-HU') 
        : "Nincs megadva";
        
      const isOverdue = date < today;
      
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            <strong>${u.client.name}</strong><br>${u.client.phone || ''}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            ${u.brand} ${u.model}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: ${isOverdue ? 'red' : 'green'};">
            <strong>${dateStr}</strong>
          </td>
        </tr>
      `;
    }).join('');

    await transporter.sendMail({
      from: '"NS-AIR Rendszer" <ajanlat@nsairklima.hu>',
      to: "nsair.klima@gmail.com",
      subject: `⚠️ Karbantartási emlékeztető - ${dueSoon.length} db gép`,
      html: `
        <div style="font-family: Arial; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #3498db;">Esedékes karbantartások</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 10px; text-align: left;">Ügyfél</th>
                <th style="padding: 10px; text-align: left;">Gép</th>
                <th style="padding: 10px; text-align: right;">Dátum</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <p style="margin-top: 20px; text-align: center;">
            <a href="https://nsairklima.vercel.app/maintenance" style="background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Részletek megtekintése</a>
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, count: dueSoon.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
