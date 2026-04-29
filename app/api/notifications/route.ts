import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAdminMaintenanceReminder } from "@/lib/mailer";

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const today = new Date();
    const units = await prisma.clientUnit.findMany({
      where: { status: "INSTALLED" },
      include: { 
        client: true, 
        maintenance: { orderBy: { performedDate: "desc" }, take: 1 },
        emailNotifications: { orderBy: { sentAt: "desc" }, take: 1 }
      }
    });

    let sentCount = 0;

    for (const unit of units) {
      const baseDate = unit.maintenance[0]?.performedDate || unit.installation;
      if (!baseDate) continue;

      const nextDue = new Date(baseDate);
      nextDue.setMonth(nextDue.getMonth() + (unit.periodMonths || 12));
      
      const notifyWindowStart = new Date(nextDue);
      notifyWindowStart.setMonth(notifyWindowStart.getMonth() - 1);

      const lastNotify = unit.emailNotifications[0]?.sentAt;
      const alreadyNotified = lastNotify && lastNotify > baseDate;

      // Ha ma benne vagyunk az 1 hónapos ablakban és még nem kaptál levelet ebben a ciklusban
      if (today >= notifyWindowStart && today < nextDue && !alreadyNotified) {
        await sendAdminMaintenanceReminder(
          unit.client.name,
          unit.client.phone || "Nincs megadva",
          `${unit.brand} ${unit.model}`
        );

        await prisma.emailNotifications.create({
          data: {
            clientId: unit.clientId,
            clientUnitId: unit.id,
            notificationType: "ADMIN_REMINDER",
            sentToEmail: process.env.EMAIL_USER!,
            status: "SUCCESS"
          }
        });
        sentCount++;
      }
    }

    return NextResponse.json({ success: true, sent: sentCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
