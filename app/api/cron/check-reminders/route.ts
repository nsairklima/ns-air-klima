import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAdminBulkMaintenanceReminder, MaintenanceDueItem } from "@/lib/mailer";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Nincs jogosultság" }, { status: 401 });
  }

  try {
    const today = new Date();

    // Lekérjük az összes INSTALLED gépet, aminek van telepítési dátuma
    const units = await prisma.clientUnit.findMany({
      where: { status: "INSTALLED", installation: { not: null } },
      include: {
        client: true,
        maintenance: { orderBy: { performedDate: "desc" }, take: 1 },
        emailNotifications: { orderBy: { sentAt: "desc" }, take: 1 }
      }
    });

    const targetEmail = "karbantartas@nsairklima.hu";
    const dueItems: MaintenanceDueItem[] = [];
    const notifiedUnits: { clientId: number; clientUnitId: number; isOverdue: boolean }[] = [];

    for (const unit of units) {
      const baseDate = unit.maintenance[0]?.performedDate || unit.installation;
      if (!baseDate) continue;

      const nextDue = new Date(baseDate);
      nextDue.setMonth(nextDue.getMonth() + (unit.periodMonths || 12));

      // Emlékeztető ablak kezdete: 1 hónappal a határidő előtt
      const reminderDay = new Date(nextDue);
      reminderDay.setMonth(reminderDay.getMonth() - 1);

      const lastNotifyDate = unit.emailNotifications[0]?.sentAt;
      const isAlreadyNotified = lastNotifyDate && lastNotifyDate > baseDate;

      const isTimeForReminder = today >= reminderDay;

      if (isTimeForReminder && !isAlreadyNotified) {
        const isOverdue = today >= nextDue;

        dueItems.push({
          clientName: unit.client.name,
          clientPhone: unit.client.phone || "Nincs tel.",
          clientAddress: unit.client.address,
          unitName: `${unit.brand} ${unit.model}${unit.location ? ` (${unit.location})` : ""}`,
          dueDate: nextDue.toLocaleDateString("hu-HU"),
          isOverdue
        });

        notifiedUnits.push({
          clientId: unit.clientId,
          clientUnitId: unit.id,
          isOverdue
        });
      }
    }

    // Ha van legalább egy esedékes gép, elküldjük az összevont e-mailt
    if (dueItems.length > 0) {
      await sendAdminBulkMaintenanceReminder(dueItems);

      // Adatbázis logolása
      for (const item of notifiedUnits) {
        await prisma.emailNotifications.create({
          data: {
            clientId: item.clientId,
            clientUnitId: item.clientUnitId,
            notificationType: item.isOverdue ? "ADMIN_OVERDUE_REMINDER" : "ADMIN_REMINDER",
            sentToEmail: targetEmail,
            status: "SUCCESS"
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent: dueItems.length > 0 ? 1 : 0,
      totalUnitsDue: dueItems.length
    });
  } catch (error: any) {
    console.error("Hiba a karbantartási emlékeztetőnél:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
