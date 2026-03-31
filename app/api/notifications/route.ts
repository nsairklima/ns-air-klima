import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import nodemailer from 'nodemailer';

export async function GET(req: Request) {
  try {
    const today = new Date();
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(today.getDate() + 60);

    const units = await prisma.clientUnit.findMany({
      where: {
        status: {
          in: ["INSTALLED", "SERVICE_ONLY"] // Figyeli a saját és a hozott gépeket is
        }
      },
      include: {
        client: true,
        maintenance: {
          orderBy: { performedDate: "desc" },
          take: 1
        }
      }
    });

    // 1. Dátum számítás és szűrés
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
      return NextResponse.json({ message: "Nincs esedékes karbantartás az aktív gépeknél." });
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

    // 2. Részletes táblázat minden ügyféladattal
    const tableRows = dueSoon.map(u => {
      const date = u.calculatedDueDate as Date;
      const dateStr = (date && date.getFullYear() > 1970) 
        ? date.toLocaleDateString('hu-HU') 
        : "Nincs megadva";
        
      const isOverdue = date < today;
      const statusLabel = u.status === "SERVICE_ONLY" ? "🛠️ Csak szerviz" : "✅ Saját telepítés";
      
      return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px; vertical-align: top;">
            <strong style="font-size: 15px;">${u.client.name}</strong><br>
            <span style="font-size: 13px; color: #555;">
              📍 ${u.client.address || 'Nincs cím'}<br>
              📞 <a href="tel:${u.client.phone}">${u.client.phone || 'Nincs tel.'}</a><br>
              ✉️ ${u.client.email || 'Nincs email'}
            </span>
          </td>
          <td style="padding: 12px; vertical-align: top;">
            <strong>${u.brand} ${u.model}</strong><br>
            <small style="color: #777;">Hely: ${u.location || '-'}</small><br>
            <small style="color: #0070f3; font-weight: bold;">${statusLabel}</small>
          </td>
          <td style="padding: 12px; vertical-align: top; text-align: right; white-space: nowrap;">
            <strong style="color: ${isOverdue ? '#e74c3c' : '#27ae60'}; font-size: 14px;">
              ${dateStr}
            </strong><br>
            <span style="font-size: 11px; color: ${isOverdue ? '#e74c3c' : '#7f8c8d'};">
              ${isOverdue ? '⚠️ LEJÁRT' : 'Esedékes'}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    await transporter.sendMail({
      from: '"NS-AIR Rendszer" <ajanlat@nsairklima.hu>',
      to: "nsair.klima@gmail.com",
      subject: `🛠️ Karbantartási lista - ${dueSoon.length} gép`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: auto; color: #2c3e50;">
          <h2 style="color: #2980b9; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Esedékes karbantartások összesítője</h2>
          <p>Az alábbi gépek karbantartása vált esedékessé (Saját telepítés és hozott gépek vegyesen):</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
              <tr style="background: #f2f2f2; text-align: left;">
                <th style="padding: 12px; border-bottom: 2px solid #3498db;">Ügyfél adatai</th>
                <th style="padding: 12px; border-bottom: 2px solid #3498db;">Gép adatai</th>
                <th style="padding: 12px; border-bottom: 2px solid #3498db; text-align: right;">Határidő</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          
          <div style="margin-top: 30px; padding: 20px; background: #f9f9f9; border-radius: 8px; text-align: center;">
            <p style="margin-bottom: 15px; font-weight: bold;">Részletes kezelés az admin felületen:</p>
            <a href="https://nsairklima.vercel.app/maintenance" 
               style="background: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
               ÜTEMTERV MEGNYITÁSA
            </a>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true, count: dueSoon.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
