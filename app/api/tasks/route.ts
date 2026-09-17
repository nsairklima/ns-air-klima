import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { v2 as cloudinary } from "cloudinary";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const sql = neon(process.env.POSTGRES_URL || "");

try {
  cloudinary.config();
} catch (error) {
  console.error("Cloudinary konfigurációs hiba:", error);
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string): string {
  return value.replace(/[^0-9+]/g, "");
}

function normalizeGeneralText(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("hu-HU")
    .replace(/\s+/g, " ");
}

type ClientSyncResult = {
  created: boolean;
  reason:
    | "created"
    | "existing-email"
    | "existing-phone"
    | "existing-name-address"
    | "existing-name"
    | "missing-name";
  clientId?: number;
};

async function createClientIfMissing({
  name,
  address,
  phone,
  email,
  note,
}: {
  name: string;
  address: string;
  phone: string;
  email: string;
  note: string;
}): Promise<ClientSyncResult> {
  const cleanName = cleanText(name);
  const cleanAddress = cleanText(address);
  const cleanPhone = cleanText(phone);
  const cleanEmail = normalizeEmail(cleanText(email));
  const cleanNote = cleanText(note);

  if (!cleanName) {
    return {
      created: false,
      reason: "missing-name",
    };
  }

  /*
   * Lehetséges egyezések lekérése.
   *
   * Ugyanazt a Prisma Client modellt használjuk,
   * mint az app/api/clients/route.ts.
   */
  const possibleClients = await prisma.client.findMany({
    where: {
      OR: [
        ...(cleanEmail
          ? [
              {
                email: {
                  equals: cleanEmail,
                  mode: "insensitive" as const,
                },
              },
            ]
          : []),

        ...(cleanPhone
          ? [
              {
                phone: {
                  not: null,
                },
              },
            ]
          : []),

        {
          name: {
            equals: cleanName,
            mode: "insensitive",
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      address: true,
      phone: true,
      email: true,
    },
  });

  /*
   * 1. Email alapján ellenőrzés.
   */
  if (cleanEmail) {
    const emailMatch = possibleClients.find((client) => {
      return (
        normalizeEmail(client.email || "") === cleanEmail
      );
    });

    if (emailMatch) {
      return {
        created: false,
        reason: "existing-email",
        clientId: emailMatch.id,
      };
    }
  }

  /*
   * 2. Telefonszám alapján ellenőrzés.
   */
  const normalizedPhone = normalizePhone(cleanPhone);

  if (normalizedPhone) {
    const phoneMatch = possibleClients.find((client) => {
      return (
        normalizePhone(client.phone || "") ===
        normalizedPhone
      );
    });

    if (phoneMatch) {
      return {
        created: false,
        reason: "existing-phone",
        clientId: phoneMatch.id,
      };
    }
  }

  /*
   * 3. Név és cím alapján ellenőrzés.
   */
  const normalizedName =
    normalizeGeneralText(cleanName);

  const normalizedAddress =
    normalizeGeneralText(cleanAddress);

  if (normalizedAddress) {
    const nameAddressMatch = possibleClients.find(
      (client) => {
        return (
          normalizeGeneralText(client.name) ===
            normalizedName &&
          normalizeGeneralText(client.address || "") ===
            normalizedAddress
        );
      }
    );

    if (nameAddressMatch) {
      return {
        created: false,
        reason: "existing-name-address",
        clientId: nameAddressMatch.id,
      };
    }
  }

  /*
   * 4. Ha nincs email, telefonszám és cím,
   * csak pontos névegyezés alapján ellenőrzünk.
   */
  if (!cleanEmail && !normalizedPhone && !normalizedAddress) {
    const nameMatch = possibleClients.find((client) => {
      return (
        normalizeGeneralText(client.name) ===
        normalizedName
      );
    });

    if (nameMatch) {
      return {
        created: false,
        reason: "existing-name",
        clientId: nameMatch.id,
      };
    }
  }

  /*
   * Nincs megfelelő meglévő ügyfél,
   * ezért létrehozzuk.
   */
  const newClient = await prisma.client.create({
    data: {
      name: cleanName,
      address: cleanAddress || null,
      phone: cleanPhone || null,
      email: cleanEmail || null,
      notes: cleanNote
        ? cleanNote +
          "\n\nAutomatikusan létrehozva munkafelvételkor."
        : "Automatikusan létrehozva munkafelvételkor.",
    },
    select: {
      id: true,
      name: true,
    },
  });

  console.log(
    "Új ügyfél automatikusan létrehozva:",
    newClient
  );

  return {
    created: true,
    reason: "created",
    clientId: newClient.id,
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const type =
      cleanText(formData.get("type")) || "telepites";

    const name = cleanText(formData.get("name"));
    const address = cleanText(formData.get("address"));
    const phone = cleanText(formData.get("phone"));
    const email = cleanText(formData.get("email"));
    const note = cleanText(formData.get("note"));

    /*
     * Email-címzettek feldolgozása.
     */
    const recipientsRaw = cleanText(
      formData.get("recipients")
    );

    let notificationEmails: string[] = [];

    if (recipientsRaw) {
      try {
        const parsedRecipients =
          JSON.parse(recipientsRaw);

        if (Array.isArray(parsedRecipients)) {
          notificationEmails = parsedRecipients
            .map((item) => cleanText(item))
            .filter(Boolean);
        }
      } catch {
        notificationEmails = recipientsRaw
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }

    if (notificationEmails.length === 0) {
      const environmentEmails =
        process.env.NOTIFICATION_EMAILS ||
        process.env.EMAIL_USER ||
        "";

      notificationEmails = environmentEmails
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    /*
     * Időpontok feldolgozása.
     */
    const scheduledAtRaw = cleanText(
      formData.get("scheduledAt")
    );

    const completedAtRaw = cleanText(
      formData.get("completedAt")
    );

    const scheduledAt = scheduledAtRaw
  ? scheduledAtRaw.slice(0, 19).replace("T", " ")
  : null;

const completedAt = completedAtRaw
  ? completedAtRaw.slice(0, 19).replace("T", " ")
  : null;

console.log("POST scheduledAtRaw:", scheduledAtRaw);
console.log("POST scheduledAt:", scheduledAt);
console.log("POST completedAtRaw:", completedAtRaw);
console.log("POST completedAt:", completedAt);

    /*
     * Képek feltöltése.
     */
    const photos = formData.getAll("photos") as File[];
    const imageUrls: string[] = [];

    for (const photo of photos) {
      if (!photo || photo.size <= 0) {
        continue;
      }

      try {
        const arrayBuffer = await photo.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise<any>(
          (resolve, reject) => {
            const uploadStream =
              cloudinary.uploader.upload_stream(
                {
                  folder: "tasks",
                  resource_type: "auto",
                },
                (uploadError, result) => {
                  if (uploadError) {
                    reject(uploadError);
                    return;
                  }

                  resolve(result);
                }
              );

            uploadStream.end(buffer);
          }
        );

        if (uploadResult?.secure_url) {
          imageUrls.push(uploadResult.secure_url);
        }
      } catch (uploadError: any) {
        console.error(
          "Képfeltöltési hiba:",
          uploadError?.message || uploadError
        );
      }
    }

    const currentDate = new Date()
      .toISOString()
      .split("T")[0];

    /*
     * Mivel a Task modellben nincs külön email mező,
     * az email továbbra is a description mezőben marad.
     */
    const description = note
      ? email
        ? `${note} | Email: ${email}`
        : note
      : email
        ? `Email: ${email}`
        : "";

let latitude: number | null = null;
let longitude: number | null = null;

try {
  if (address.trim()) {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=hu&q=${encodeURIComponent(
        address
      )}`
    );

    const data = await response.json();

    if (
      Array.isArray(data) &&
      data.length > 0
    ) {
      latitude = Number(data[0].lat);
      longitude = Number(data[0].lon);

      console.log(
        "Koordináták:",
        latitude,
        longitude
      );
    }
  }
} catch (error) {
  console.error(
    "Geokódolási hiba:",
    error
  );
}
    
let latitude: number | null = null;
let longitude: number | null = null;

try {
  if (address.trim()) {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=hu&q=${encodeURIComponent(address)}`
    );

    const data = await response.json();

    if (
      Array.isArray(data) &&
      data.length > 0
    ) {
      latitude = Number(data[0].lat);
      longitude = Number(data[0].lon);
    }
  }
} catch (error) {
  console.error(
    "Geokódolási hiba:",
    error
  );
}
    
    /*
     * Munka létrehozása.
     */
    const insertedTasks = await sql`
     INSERT INTO "Task" (
  ...
  "scheduled_at",
  "completed_at",
  "latitude",
  "longitude",
  "updatedAt"
)
      VALUES (
        ${type},
        ${name || "Új munka"},
        ${name},
        ${address},
        ${phone},
        ${currentDate},
        ${description},
        ${JSON.stringify(imageUrls)},
      ${scheduledAt},
${completedAt},
${latitude},
${longitude},
NOW()

      )
      RETURNING
        "id",
        "clientName"
    `;

    const newTaskId = insertedTasks[0]?.id;

    console.log(
      "Munka létrehozva, azonosító:",
      newTaskId
    );

    /*
     * Ügyfél automatikus létrehozása.
     *
     * Ha ez hibára fut, most már a frontend
     * megkapja a tényleges hibaüzenetet.
     */
    let clientSyncResult: ClientSyncResult;

    try {
      clientSyncResult = await createClientIfMissing({
        name,
        address,
        phone,
        email,
        note,
      });
    } catch (clientError: any) {
      console.error(
        "Automatikus ügyféllétrehozási hiba:",
        clientError
      );

      return NextResponse.json(
        {
          error:
            "A munka létrejött, de az ügyfél mentése nem sikerült: " +
            (clientError?.message ||
              String(clientError)),
          taskId: newTaskId,
          clientCreated: false,
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Email-küldés.
     */
    let emailSent = false;

    if (notificationEmails.length > 0) {
      try {
        const transporter =
          nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT),
            secure: true,
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
            tls: {
              rejectUnauthorized: false,
            },
          });

        const typeLabel =
          type === "telepites"
            ? "🛠️ Telepítés"
            : "🧹 Karbantartás";

        await transporter.sendMail({
          from:
            `"Klíma Rendszer" <${process.env.EMAIL_USER}>`,
          to: notificationEmails,
          subject:
            `📋 Új munka felvéve: ${typeLabel} ` +
            `(${name || "Névtelen"})`,
          html: `
            <div
              style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                overflow: hidden;
              "
            >
              <div
                style="
                  background-color: #2c3e50;
                  color: white;
                  padding: 20px;
                  text-align: center;
                "
              >
                <h2 style="margin: 0;">
                  Új munka érkezett
                </h2>

                <p style="margin: 6px 0 0;">
                  ${typeLabel}
                </p>
              </div>

              <div style="padding: 20px;">
                <p>
                  <strong>Munkaazonosító:</strong>
                  #${newTaskId || "-"}
                </p>

                <p>
                  <strong>Név:</strong>
                  ${name || "-"}
                </p>

                <p>
                  <strong>Cím:</strong>
                  ${address || "-"}
                </p>

                <p>
                  <strong>Telefon:</strong>
                  ${phone || "-"}
                </p>

                <p>
                  <strong>Email:</strong>
                  ${email || "-"}
                </p>

                <p>
                  <strong>Tervezett időpont:</strong>
                  ${scheduledAt || "-"}
                </p>

                <p>
                  <strong>Megjegyzés:</strong>
                  ${note || "-"}
                </p>
              </div>
            </div>
          `,
        });

        emailSent = true;
      } catch (mailError) {
        console.error(
          "Email küldési hiba:",
          mailError
        );
      }
    }

    let message = "Munka sikeresen elmentve.";

  if (clientSyncResult.created) {
  message +=
    " Az ügyfél automatikusan bekerült az ügyfelek közé.";
} else if (
  clientSyncResult.reason === "missing-name"
) {
  message +=
    " Ügyfél nem készült, mert nincs megadva név.";
} else {
  message +=
    " Az ügyfél már szerepel az ügyfelek között.";
}
    if (emailSent) {
  message +=
    " Az értesítő email elküldve.";
}

return NextResponse.json({
  message,
  taskId: newTaskId,
  clientCreated: clientSyncResult.created,
  clientId: clientSyncResult.clientId || null,
  emailSent,
  driveLinks: imageUrls,
});

} catch (error: any) {
  console.error(
    "Munka mentési hiba:",
    error
  );

  return NextResponse.json(
    {
      error:
        error?.message ||
        "Hiba történt a mentés során.",
    },
    {
      status: 500,
    }
  );
}
}
