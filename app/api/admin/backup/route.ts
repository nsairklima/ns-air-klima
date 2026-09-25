import { NextResponse } from "next/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const getPrisma = async () => {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return null;
  }

  const { prisma } = await import("@/lib/prisma");
  return prisma;
};

const resend = new Resend(process.env.RESEND_API_KEY);

function serializeBackup(data: unknown) {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => {
      if (typeof value === "bigint") {
        return value.toString();
      }

      if (
        value &&
        typeof value === "object" &&
        typeof value.toJSON === "function"
      ) {
        return value.toJSON();
      }

      return value;
    })
  );
}

async function performBackup() {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return {
      success: true,
      message: "Build fázisban a mentés kihagyva.",
    };
  }

  const prisma = await getPrisma();

  if (!prisma) {
    return {
      success: false,
      message: "Az adatbázis nem érhető el.",
    };
  }

  try {
    /*
     * Minden modellt külön kérünk le.
     *
     * A kapcsolt adatokat nem include-oljuk újra mindenhol,
     * mert akkor ugyanazok az adatok többször bekerülnének
     * a mentésbe.
     */

    const [
      users,
      clients,
      clientUnits,
      maintenanceLogs,
      emailNotifications,
      quotes,
      quoteItems,
      inventory,
      calendarEvents,
      tasks,
      emailSettings,
    ] = await prisma.$transaction([
      prisma.user.findMany({
        orderBy: {
          id: "asc",
        },
      }),

      prisma.client.findMany({
        orderBy: {
          id: "asc",
        },
      }),

      prisma.clientUnit.findMany({
        orderBy: {
          id: "asc",
        },
      }),

      prisma.maintenanceLog.findMany({
        orderBy: {
          id: "asc",
        },
      }),

      prisma.emailNotifications.findMany({
        orderBy: {
          id: "asc",
        },
      }),

      prisma.quote.findMany({
        orderBy: {
          id: "asc",
        },
      }),

      prisma.quoteItem.findMany({
        orderBy: {
          id: "asc",
        },
      }),

      prisma.item.findMany({
        orderBy: {
          id: "asc",
        },
      }),

      prisma.calendarEvent.findMany({
        orderBy: {
          id: "asc",
        },
      }),

      prisma.task.findMany({
        orderBy: {
          id: "asc",
        },
      }),

      prisma.emailSetting.findMany({
        orderBy: {
          id: "asc",
        },
      }),
    ]);

    const generatedAt = new Date();

    const backupData = serializeBackup({
      metadata: {
        generatedAt: generatedAt.toISOString(),
        generatedAtHu: generatedAt.toLocaleString("hu-HU", {
          timeZone: "Europe/Budapest",
        }),
        type: "TELJES ADATBÁZIS MENTÉS",
        schemaVersion: 1,
        databaseProvider: "postgresql",
      },

      counts: {
        users: users.length,
        clients: clients.length,
        clientUnits: clientUnits.length,
        maintenanceLogs: maintenanceLogs.length,
        emailNotifications: emailNotifications.length,
        quotes: quotes.length,
        quoteItems: quoteItems.length,
        inventory: inventory.length,
        calendarEvents: calendarEvents.length,
        tasks: tasks.length,
        emailSettings: emailSettings.length,
      },

      data: {
        users,
        clients,
        clientUnits,
        maintenanceLogs,
        emailNotifications,
        quotes,
        quoteItems,
        inventory,
        calendarEvents,
        tasks,
        emailSettings,
      },
    });

    const backupJson = JSON.stringify(backupData, null, 2);
    const backupSizeBytes = Buffer.byteLength(backupJson, "utf8");
    const backupSizeKb = Math.round(backupSizeBytes / 1024);

    if (!process.env.RESEND_API_KEY) {
      return {
        success: false,
        message:
          "A mentés elkészült, de nincs beállítva RESEND_API_KEY, ezért az email nem lett elküldve.",
        counts: backupData.counts,
        backupSizeBytes,
        backupSizeKb,
      };
    }

    const reportDate = generatedAt.toLocaleDateString("hu-HU", {
      timeZone: "Europe/Budapest",
    });

    const fileDate = generatedAt.toISOString().split("T")[0];

    const emailResult = await resend.emails.send({
      from: "NS-AIR Rendszer <onboarding@resend.dev>",
      to: "nsair.klima@gmail.com",
      subject: `📋 Teljes rendszermentés - ${reportDate}`,

      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>NS-AIR teljes adatbázis-mentés</h2>

          <p>
            A rendszer teljes adatbázis-mentése elkészült.
          </p>

          <p>
            <strong>Mentés időpontja:</strong>
            ${backupData.metadata.generatedAtHu}
          </p>

          <p>
            <strong>Mentés mérete:</strong>
            ${backupSizeKb.toLocaleString("hu-HU")} KB
          </p>

          <h3>Mentett rekordok</h3>

          <ul>
            <li>Felhasználók: ${users.length}</li>
            <li>Ügyfelek: ${clients.length}</li>
            <li>Ügyfélgépek: ${clientUnits.length}</li>
            <li>Karbantartási naplók: ${maintenanceLogs.length}</li>
            <li>Email-értesítések: ${emailNotifications.length}</li>
            <li>Ajánlatok: ${quotes.length}</li>
            <li>Ajánlati tételek: ${quoteItems.length}</li>
            <li>Raktári tételek: ${inventory.length}</li>
            <li>Naptáresemények: ${calendarEvents.length}</li>
            <li>Munkák és feladatok: ${tasks.length}</li>
            <li>Email-beállítások: ${emailSettings.length}</li>
          </ul>

          <p>
            A teljes JSON-mentés az email csatolmányában található.
          </p>
        </div>
      `,

      attachments: [
        {
          filename: `nsair_teljes_backup_${fileDate}.json`,
          content: Buffer.from(backupJson, "utf8").toString("base64"),
        },
      ],
    });

    if (emailResult.error) {
      console.error(
        "Backup email küldési hiba:",
        emailResult.error
      );

      return {
        success: false,
        message:
          "Az adatbázis lekérése sikerült, de a mentési email elküldése sikertelen.",
        error: emailResult.error,
        counts: backupData.counts,
        backupSizeBytes,
        backupSizeKb,
      };
    }

    return {
      success: true,
      message:
        "A teljes adatbázis-mentés elkészült és emailben elküldve.",
      emailId: emailResult.data?.id || null,
      counts: backupData.counts,
      backupSizeBytes,
      backupSizeKb,
    };
  } catch (error: any) {
    console.error("Teljes backup hiba:", error);

    throw new Error(
      error?.message ||
        "Ismeretlen hiba történt a teljes mentés készítésekor."
    );
  }
}

export async function POST() {
  try {
    const result = await performBackup();

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Ismeretlen mentési hiba.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function GET() {
  try {
    const result = await performBackup();

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Ismeretlen mentési hiba.",
      },
      {
        status: 500,
      }
    );
  }
}
