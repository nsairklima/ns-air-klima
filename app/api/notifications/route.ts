import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

// POST /api/notifications – automatikus értesítések küldése
export async function POST() {
  try {
    const today = new Date();
    const soon = new Date();
    soon.setDate(today.getDate() + 14); // 14 nap múlva esedékes

    const dueMaintenances = await prisma.maintenanceLog.findMany({
      where: {
        nextDue: {
          lte: soon
        }
      },
      include: {
        unit: {
          include: { client: true }
        }
      }
    });

    const resend = new Resend(process.env.RESEND_API_KEY);

    for (const item of dueMaintenances) {
      const client = item.unit.client;

      await resend.emails.send({
        from: "NS-AIR KLÍMA <onboarding@resend.dev>",
        to: client.email,
        subject: "Karbantartási értesítés – NS-AIR KLÍMA",
        html: `
          <h2>Tisztelt ${client.name}!</h2>
          <p>Szeretnénk értesíteni, hogy az Ön klímaberendezése hamarosan karbantartást igényel.</p>
          <p><strong>Készülék:</strong> ${item.unit.brand} ${item.unit.model}</p>
          <p><strong>Esedékes dátum:</strong> ${item.nextDue?.toISOString().slice(0, 10)}</p>
          <p>Kérem jelezzen vissza időpont egyeztetés miatt.</p>
          <br>
          <p>Üdvözlettel,<br>NS-AIR KLÍMA</p>
        `
      });

      await prisma.emailNotifications.create({
        data: {
          clientId: client.id,
          clientUnitId: item.unit.id,
          sentToEmail: client.email,
          notificationType: "maintenance_due",
          status: "success"
        }
      });
    }

    return Response.json({
      message: "Email értesítések kiküldve.",
      count: dueMaintenances.length
    });

  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Hiba az értesítések küldésekor." },
      { status: 500 }
    );
  }
}
