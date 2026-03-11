import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

// POST /api/notifications – automatikus értesítések kiküldése
export async function POST() {
  try {
    // 1) Lekérjük az esedékes vagy hamarosan esedékes karbantartásokat
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

    // 2) E-mail küldő beállítása
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Gmail felhasználó
        pass: process.env.EMAIL_PASS  // Gmail app jelszó
      }
    });

    // 3) Minden esedékes karbantartásnál küldünk emailt
    for (const item of dueMaintenances) {
      const client = item.unit.client;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: client.email,
        subject: "Karbantartási értesítés – NS-AIR KLÍMA",
        html: `
          <h2>Tisztelt ${client.name}!</h2>
          <p>Szeretnénk értesíteni, hogy az Ön klímaberendezése hamarosan karbantartást igényel.</p>
          <p><strong>Készülék:</strong> ${item.unit.brand} ${item.unit.model}</p>
          <p><strong>Esedékes dátum:</strong> ${item.nextDue?.toISOString().substring(0, 10)}</p>
          <p>Kérem jelezzen vissza időpont egyeztetés miatt.</p>
          <br>
          <p>Üdvözlettel,<br>NS-AIR KLÍMA</p>
        `
      };

      // email elküldése
      await transporter.sendMail(mailOptions);

      // naplózás a database-be
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
      { error: "Hiba az értesítések kiküldésekor." },
      { status: 500 }
    );
  }
}
