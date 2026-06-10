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
    await sendAdminMaintenanceReminder("RENDSZER TESZT", "000", "ADATBÁZIS KAPCSOLÓDÁS OK - FIX CÍM");
    // --------------------

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

    let sentCount = 0;
    const targetEmail = "karbantartas@nsairklima.hu";

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

      // JAVÍTOTT FELTÉTEL: 
      // Ha benne vagyunk az 1 hónapos ablakban VAGY a mai nap már későbbi, mint a határidő (LEJÁRT/ELMARADT)
      // ÉS még nem küldtünk erről értesítést az utolsó szerviz óta
      const isTimeForReminder = today >= reminderDay; 

      if (isTimeForReminder && !isAlreadyNotified) {
        const isOverdue = today >= nextDue;
        const statusPrefix = isOverdue ? "🚨 [LEJÁRT/ELMARADT] " : "⚠️ [1 HÓNAP MÚLVA] ";

        await sendAdminMaintenanceReminder(
          `${statusPrefix}${unit.client.name}`,
          unit.client.phone || "Nincs tel.",
          `${unit.brand} ${unit.model} (Határidő: ${nextDue.toLocaleDateString('hu-HU')})`
        );

        await prisma.emailNotifications.create({
          data: {
            clientId: unit.clientId,
            clientUnitId: unit.id,
            notificationType: isOverdue ? "ADMIN_OVERDUE_REMINDER" : "ADMIN_REMINDER",
            sentToEmail: targetEmail,
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
