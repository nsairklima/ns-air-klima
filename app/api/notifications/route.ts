import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export async function GET(req: Request) {
  // Biztonsági ellenőrzés (opcionális, de ajánlott Vercel Cron-hoz)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const today = new Date();
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(today.getDate() + 60);

    // Lekérjük az összes gépet a legutolsó karbantartással
    const units = await prisma.clientUnit.findMany({
      include: {
        client: true,
        maintenance: {
          orderBy: { performedDate: "desc" },
          take: 1
        }
      }
    });

    // Szűrés azokra, amik 60 napon belül lejárnak vagy már lejártak
    const dueSoon = units.filter(unit => {
      const lastLog = unit.maintenance[0];
      if (!lastLog?.nextDue) return false;
      const dueDate = new Date(lastLog.nextDue);
      return dueDate <= sixtyDaysFromNow;
    });

    if (dueSoon.length === 0) {
      return NextResponse.json({ message: "Nincs esedékes karbantartás." });
    }

    // Email küldő beállítása (Gmail app jelszóval)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'nsair.klima@gmail.com', 
        pass: process.env.EMAIL_APP_PASSWORD, // Itt a Gmail-ben generált alkalmazásjelszót kell használnod!
      },
    });

    const list = dueSoon.map(u => 
      `• ${u.client.name} - ${u.brand} ${u.model} | Határidő: ${new Date(u.maintenance[0].nextDue!).toLocaleDateString('hu-HU')}`
    ).join('\n');

    await transporter.sendMail({
      from: '"NS-AIR Rendszer" <nsair.klima@gmail.com>',
      to: "nsair.klima@gmail.com",
      subject: `⚠️ Karbantartási emlékeztető (${dueSoon.length} db tétel)`,
      text: `A következő karbantartások esedékesek vagy lejártak:\n\n${list}\n\nItt tudod megnézni: https://nsairklima.vercel.app/maintenance`,
    });

    return NextResponse.json({ success: true, sentCount: dueSoon.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Hiba az automata küldéskor" }, { status: 500 });
  }
}
