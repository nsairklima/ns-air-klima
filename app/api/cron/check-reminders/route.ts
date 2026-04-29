import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAdminMaintenanceReminder } from "@/lib/mailer";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Nincs jogosultság" }, { status: 401 });
  }

  try {
    // --- TESZT ÜZENET ---
    // Ez minden futáskor küld egy emailt, hogy lásd: a kapcsolat él!
    await sendAdminMaintenanceReminder("RENDSZER TESZT", "000", "ADATBÁZIS KAPCSOLÓDÁS OK");
    // --------------------

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
      const baseDate = unit.maintenance[0]?.performedDate || unit.installation;
      if (!baseDate) continue;

      const nextDue = new Date(baseDate);
      nextDue.setMonth(nextDue.getMonth() + (unit.periodMonths || 12));
      const reminderDay = new Date(nextDue);
      reminderDay.setMonth(reminderDay.getMonth() - 1);

      const lastNotifyDate = unit.emailNotifications[0]?.sentAt;
      const isAlreadyNotified = lastNotifyDate && lastNotifyDate > baseDate;

      if (today >= reminderDay && today < nextDue && !isAlreadyNotified) {
        await sendAdminMaintenanceReminder(
          unit.client.name,
          unit.client.phone || "Nincs tel.",
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

    return NextResponse.json({ success: true, emailsSent: sentCount, testEmail: "Sent" });
  } catch (error: any) {
    console.error("Hiba részletei:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
