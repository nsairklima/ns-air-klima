import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMaintenanceReminder } from "@/lib/mailer"; // A korábban írt mailer segédfájl

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
      if (!unit.client?.email) continue;

      // Kiindulási pont: utolsó szerviz, vagy ha nem volt, akkor a telepítés
      const baseDate = unit.maintenance[0]?.performedDate || unit.installation;
      if (!baseDate) continue;

      const nextDue = new Date(baseDate);
      nextDue.setMonth(nextDue.getMonth() + (unit.periodMonths || 12));

      // Értesítés napja: 1 hónappal az esedékesség előtt
      const reminderDay = new Date(nextDue);
      reminderDay.setMonth(reminderDay.getMonth() - 1);

      // Ellenőrizzük, küldtünk-e már ebben a ciklusban értesítést
      const lastNotifyDate = unit.emailNotifications[0]?.sentAt;
      const isAlreadyNotifiedThisCycle = lastNotifyDate && lastNotifyDate > baseDate;

      // Ha elérkezett az idő és még nem küldtük ki
      if (today >= reminderDay && today < nextDue && !isAlreadyNotifiedThisCycle) {
        
        await sendMaintenanceReminder(
          unit.client.email,
          unit.client.name,
          `${unit.brand} ${unit.model}`
        );

        // Mentés a Neon-ba, hogy ne küldjük újra holnap
        await prisma.emailNotifications.create({
          data: {
            clientId: unit.clientId,
            clientUnitId: unit.id,
            notificationType: "MAINTENANCE_PREVALENT",
            sentToEmail: unit.client.email,
            status: "SUCCESS"
          }
        });

        sentCount++;
      }
    }

    return NextResponse.json({ 
      message: "Ellenőrzés kész", 
      emailsSent: sentCount,
      database: "Neon-PostgreSQL" 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
