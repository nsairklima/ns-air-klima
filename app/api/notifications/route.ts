import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAdminMaintenanceReminder } from "@/lib/mailer";

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Kényszerített csatlakozás a Neon felélesztéséhez
    await prisma.$connect();

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
            sentToEmail: process.env.EMAIL_USER || "karbantartas@nsairklima.hu",
            status: "SUCCESS"
          }
        });
        sentCount++;
      }
    }

    return NextResponse.json({ success: true, sent: sentCount });
  } catch (error: any) {
    console.error("Adatbázis kapcsolódási hiba:", error.message);
    return NextResponse.json({ 
      error: "Kapcsolódási hiba", 
      details: error.message,
      env_check: process.env.DATABASE_URL ? "URL beállítva" : "URL hiányzik"
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
