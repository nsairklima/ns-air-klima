import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMaintenanceReminder } from "@/lib/mailer";

export async function GET(req: Request) {
  // Vercel Cron biztonsági ellenőrzés
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const today = new Date();
    const units = await prisma.clientUnit.findMany({
      where: { status: "INSTALLED", installation: { not: null } },
      include: { 
        client: true, 
        maintenance: { orderBy: { performedDate: "desc" }, take: 1 },
        emailNotifications: { orderBy: { sentAt: "desc" }, take: 1 }
      }
    });

    let sentCount = 0;

    for (const unit of units) {
      if (!unit.client?.email) continue;

      const baseDate = unit.maintenance[0]?.performedDate || unit.installation;
      if (!baseDate) continue;

      // Számolás: Bázis dátum + ciklus hónap - 1 hónap értesítéshez
      const nextDue = new Date(baseDate);
      nextDue.setMonth(nextDue.getMonth() + (unit.periodMonths || 12));
      
      const notifyDate = new Date(nextDue);
      notifyDate.setMonth(notifyDate.getMonth() - 1);

      // Ellenőrzés: ma van-e az értesítési ablakban ÉS ebben a ciklusban még nem ment ki levél
      const lastSent = unit.emailNotifications[0]?.sentAt;
      const alreadyNotified = lastSent && lastSent > baseDate;

      if (today >= notifyDate && today < nextDue && !alreadyNotified) {
        await sendMaintenanceReminder(
          unit.client.email,
          unit.client.name,
          `${unit.brand} ${unit.model}`
        );

        await prisma.emailNotifications.create({
          data: {
            clientId: unit.clientId,
            clientUnitId: unit.id,
            notificationType: "1_MONTH_REMINDER",
            sentToEmail: unit.client.email,
            status: "SUCCESS"
          }
        });
        sentCount++;
      }
    }

    return NextResponse.json({ success: true, emailsSent: sentCount });
  } catch (error: any) {
    console.error("Cron hiba:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
