import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAdminMaintenanceReminder } from "@/lib/mailer"; // Frissített név

export async function GET(req: Request) {
  // Biztonsági ellenőrzés a headerből
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Hoppá! Nincs jogosultságod." }, { status: 401 });
  }

  try {
    const today = new Date();
    
    // Lekérjük az összes telepített gépet
    const units = await prisma.clientUnit.findMany({
      where: {
        status: "INSTALLED",
        installation: { not: null },
      },
      include: {
        client: true,
        maintenance: { orderBy: { performedDate: "desc" }, take: 1 },
        emailNotifications: {
          orderBy: { sentAt: "desc" },
          take: 1
        }
      }
    });

    let sentCount = 0;

    for (const unit of units) {
      // Kiindulási pont: utolsó szerviz, vagy ha nem volt, akkor a telepítés
      const baseDate = unit.maintenance[0]?.performedDate || unit.installation;
      if (!baseDate) continue;

      const nextDue = new Date(baseDate);
      nextDue.setMonth(nextDue.getMonth() + (unit.periodMonths || 12));

      // Értesítés napja: 1 hónappal az esedékesség előtt
      const reminderDay = new Date(nextDue);
      reminderDay.setMonth(reminderDay.getMonth() - 1);

      // Ellenőrizzük, küldtünk-e már ebben a ciklusban értesítést neked erről a gépről
      const lastNotifyDate = unit.emailNotifications[0]?.sentAt;
      const isAlreadyNotifiedThisCycle = lastNotifyDate && lastNotifyDate > baseDate;

      // Ha ma benne vagyunk az 1 hónapos ablakban és még nem kaptál levelet
      if (today >= reminderDay && today < nextDue && !isAlreadyNotifiedThisCycle) {
        
        // ÉRTESÍTÉS KÜLDÉSE NEKED (karbantartas@nsairklima.hu)
        await sendAdminMaintenanceReminder(
          unit.client.name,
          unit.client.phone || "Nincs megadva",
          `${unit.brand} ${unit.model}`
        );

        // Mentés a Neon-ba, hogy ne küldjük újra holnap ugyanerről
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

    return NextResponse.json({ 
      message: "Admin értesítések ellenőrzése kész", 
      emailsSent: sentCount,
      database: "Neon-PostgreSQL" 
    });
  } catch (error: any) {
    console.error("Cron hiba:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
