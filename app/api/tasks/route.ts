import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { v2 as cloudinary } from "cloudinary";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

const sql = neon(process.env.POSTGRES_URL || "");

try {
  cloudinary.config();
} catch (error) {
  console.error("Cloudinary config hiba:", error);
}

function cleanValue(value: string) {
  return value.trim();
}

async function createClientIfMissing({
  name,
  address,
  phone,
  email,
}: {
  name: string;
  address: string;
  phone: string;
  email: string;
}) {
  const cleanName = cleanValue(name);
  const cleanAddress = cleanValue(address);
  const cleanPhone = cleanValue(phone);
  const cleanEmail = cleanValue(email).toLowerCase();

  if (!cleanName) {
    console.log(
      "Az ügyfél nem került létrehozásra, mert nincs megadva név."
    );

    return {
      created: false,
      reason: "missing-name",
    };
  }

  /*
   * 1. Email alapján keresünk, ha van email.
   */
  if (cleanEmail) {
    const clientsByEmail = await sql`
      SELECT
        "id",
        "name"
      FROM "Client"
      WHERE LOWER(TRIM(COALESCE("email", ''))) = ${cleanEmail}
      LIMIT 1
    `;

    if (clientsByEmail.length > 0) {
      console.log(
        "Az ügyfél már létezik email alapján:",
        clientsByEmail[0]
      );

      return {
        created: false,
        reason: "existing-email",
        client: clientsByEmail[0],
      };
    }
  }

  /*
   * 2. Telefonszám alapján keresünk, ha van telefonszám.
   *
   * A regexp_replace eltávolítja a szóközöket,
   * kötőjeleket, zárójeleket és egyéb karaktereket.
   */
  if (cleanPhone) {
    const clientsByPhone = await sql`
      SELECT
        "id",
        "name"
      FROM "Client"
      WHERE
        REGEXP_REPLACE(
          COALESCE("phone", ''),
          '[^0-9+]',
          '',
          'g'
        ) =
        REGEXP_REPLACE(
          ${cleanPhone},
          '[^0-9+]',
          '',
          'g'
        )
      LIMIT 1
    `;

    if (clientsByPhone.length > 0) {
      console.log(
        "Az ügyfél már létezik telefonszám alapján:",
        clientsByPhone[0]
      );

      return {
        created: false,
        reason: "existing-phone",
        client: clientsByPhone[0],
      };
    }
  }

  /*
   * 3. Név és cím alapján keresünk.
   */
  const clientsByNameAndAddress = await sql`
    SELECT
      "id",
      "name"
    FROM "Client"
    WHERE
      LOWER(TRIM("name")) = LOWER(TRIM(${cleanName}))
      AND
      LOWER(TRIM(COALESCE("address", ''))) =
      LOWER(TRIM(${cleanAddress}))
    LIMIT 1
  `;

  if (clientsByNameAndAddress.length > 0) {
    console.log(
      "Az ügyfél már létezik név és cím alapján:",
      clientsByNameAndAddress[0]
    );

    return {
      created: false,
      reason: "existing-name-address",
      client: clientsByNameAndAddress[0],
    };
  }

  /*
   * Ha egyik keresés sem adott találatot,
   * létrehozzuk az ügyfelet.
   */
  const insertedClients = await sql`
    INSERT INTO "Client" (
      "name",
      "address",
      "phone",
      "email",
      "notes",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${cleanName},
      ${cleanAddress || null},
      ${cleanPhone || null},
      ${cleanEmail || null},
      ${"Automatikusan létrehozva új munka rögzítésekor."},
      NOW(),
      NOW()
    )
    RETURNING
      "id",
      "name",
      "address",
      "phone",
      "email"
  `;

  console.log(
    "Új ügyfél automatikusan létrehozva:",
    insertedClients[0]
  );

  return {
    created: true,
    reason: "new-client",
    client: insertedClients[0],
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const type =
      (formData.get("type") as string) ||
      "telepites";

    const name =
      (formData.get("name") as string) || "";

    const address =
      (formData.get("address") as string) || "";

    const phone =
      (formData.get("phone") as string) || "";

    const email =
      (formData.get("email") as string) || "";

    const note =
      (formData.get("note") as string) || "";

    /*
     * Címzettek feldolgozása.
     */
    const recipientsRaw =
      formData.get("recipients") as string;

    let notificationEmails: string[] = [];

    if (recipientsRaw) {
      try {
        const parsedRecipients =
          JSON.parse(recipientsRaw);

        if (Array.isArray(parsedRecipients)) {
          notificationEmails =
            parsedRecipients
              .map((item) => String(item).trim())
              .filter(Boolean);
        }
      } catch {
        notificationEmails =
          recipientsRaw
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
      }
    }

    if (notificationEmails.length === 0) {
      const envEmails =
        process.env.NOTIFICATION_EMAILS ||
        process.env.EMAIL_USER ||
        "";

      notificationEmails =
        envEmails
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
    }

    /*
     * Időpontok feldolgozása.
     */
    const scheduledAtRaw =
      formData.get("scheduledAt") as string;

    const completedAtRaw =
      formData.get("completedAt") as string;

    const scheduledAt = scheduledAtRaw
      ? scheduledAtRaw.replace("T", " ")
      : null;

    const completedAt = completedAtRaw
      ? completedAtRaw.replace("T", " ")
      : null;

    /*
     * Képek feltöltése.
     */
    const photos =
      formData.getAll("photos") as File[];

    const imageUrls: string[] = [];

    for (const photo of photos) {
      if (
        !photo ||
        typeof photo !== "object" ||
        !("size" in photo) ||
        photo.size <= 0
      ) {
        continue;
      }

      try {
        const arrayBuffer =
          await photo.arrayBuffer();

        const buffer =
          Buffer.from(arrayBuffer);

        const uploadResult =
          await new Promise<any>(
            (resolve, reject) => {
              const uploadStream =
                cloudinary.uploader.upload_stream(
                  {
                    folder: "tasks",
                    resource_type: "auto",
                  },
                  (error, result) => {
                    if (error) {
                      reject(error);
                      return;
                    }

                    resolve(result);
                  }
                );

              uploadStream.end(buffer);
            }
          );

        if (uploadResult?.secure_url) {
          imageUrls.push(
            uploadResult.secure_url
          );
        }
      } catch (uploadError: any) {
        console.error(
          "Képfeltöltési hiba:",
          uploadError?.message ||
            uploadError
        );
      }
    }

    const currentDate =
      new Date()
        .toISOString()
        .split("T")[0];

    const description = note
      ? email
        ? `${note} | Email: ${email}`
        : note
      : email
        ? `Email: ${email}`
        : "";

    /*
     * Munka adatbázisba mentése.
     */
    const insertedTasks = await sql`
      INSERT INTO "Task" (
        "type",
        "title",
        "clientName",
        "address",
        "phone",
        "date",
        "description",
        "images",
        "scheduled_at",
        "completed_at",
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
        NOW()
      )
      RETURNING "id"
    `;

    const newTaskId =
      insertedTasks[0]?.id;

    /*
     * Ügyfél automatikus létrehozása,
     * ha még nem szerepel a Client táblában.
     */
    let clientSyncResult: {
      created: boolean;
      reason: string;
      client?: any;
    } = {
      created: false,
      reason: "not-processed",
    };

    try {
      clientSyncResult =
        await createClientIfMissing({
          name,
          address,
          phone,
          email,
        });
    } catch (clientError) {
      /*
       * Az ügyfélszinkronizálás hibája nem törli
       * a már sikeresen létrehozott munkát.
       */
      console.error(
        "Automatikus ügyféllétrehozási hiba:",
        clientError
      );

      clientSyncResult = {
        created: false,
        reason: "client-sync-error",
      };
    }

    /*
     * Email-értesítés.
     */
    let emailSent = false;

    if (notificationEmails.length > 0) {
      try {
        const transporter =
          nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(
              process.env.EMAIL_PORT
            ),
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
                  color: #ffffff;
                  padding: 20px;
                  text-align: center;
                "
              >
                <h2 style="margin: 0;">
                  Új munka érkezett a rendszerbe
                </h2>

                <p
                  style="
                    margin: 5px 0 0 0;
                    opacity: 0.8;
                  "
                >
                  ${typeLabel}
                </p>
              </div>

              <div
                style="
                  padding: 20px;
                  font-size: 14px;
                  color: #333;
                "
              >
                <table
                  style="
                    width: 100%;
                    border-collapse: collapse;
                  "
                >
                  <tr
                    style="
                      border-bottom: 1px solid #eee;
                    "
                  >
                    <td
                      style="
                        padding: 10px;
                        font-weight: bold;
                        width: 35%;
                      "
                    >
                      Munkaazonosító:
                    </td>

                    <td style="padding: 10px;">
                      #${newTaskId || "-"}
                    </td>
                  </tr>

                  <tr
                    style="
                      border-bottom: 1px solid #eee;
                    "
                  >
                    <td
                      style="
                        padding: 10px;
                        font-weight: bold;
                      "
                    >
                      Munkatípus:
                    </td>

                    <td style="padding: 10px;">
                      ${typeLabel}
                    </td>
                  </tr>

                  <tr
                    style="
                      border-bottom: 1px solid #eee;
                    "
                  >
                    <td
                      style="
                        padding: 10px;
                        font-weight: bold;
                      "
                    >
                      Név:
                    </td>

                    <td style="padding: 10px;">
                      ${name || "-"}
                    </td>
                  </tr>

                  <tr
                    style="
                      border-bottom: 1px solid #eee;
                    "
                  >
                    <td
                      style="
                        padding: 10px;
                        font-weight: bold;
                      "
                    >
                      Cím:
                    </td>

                    <td style="padding: 10px;">
                      ${address || "-"}
                    </td>
                  </tr>

                  <tr
                    style="
                      border-bottom: 1px solid #eee;
                    "
                  >
                    <td
                      style="
                        padding: 10px;
                        font-weight: bold;
                      "
                    >
                      Telefon:
                    </td>

                    <td style="padding: 10px;">
                      ${phone || "-"}
                    </td>
                  </tr>

                  <tr
                    style="
                      border-bottom: 1px solid #eee;
                    "
                  >
                    <td
                      style="
                        padding: 10px;
                        font-weight: bold;
                      "
                    >
                      Email:
                    </td>

                    <td style="padding: 10px;">
                      ${email || "-"}
                    </td>
                  </tr>

                  <tr
                    style="
                      border-bottom: 1px solid #eee;
                    "
                  >
                    <td
                      style="
                        padding: 10px;
                        font-weight: bold;
                      "
                    >
                      Tervezett időpont:
                    </td>

                    <td style="padding: 10px;">
                      ${scheduledAt || "-"}
                    </td>
                  </tr>

                  <tr
                    style="
                      border-bottom: 1px solid #eee;
                    "
                  >
                    <td
                      style="
                        padding: 10px;
                        font-weight: bold;
                      "
                    >
                      Megvalósult időpont:
                    </td>

                    <td style="padding: 10px;">
                      ${completedAt || "-"}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding: 10px;
                        font-weight: bold;
                      "
                    >
                      Megjegyzés:
                    </td>

                    <td style="padding: 10px;">
                      ${note || "-"}
                    </td>
                  </tr>
                </table>
              </div>

              <div
                style="
                  background-color: #f8f9fa;
                  padding: 15px;
                  text-align: center;
                  font-size: 12px;
                  color: #7f8c8d;
                "
              >
                Automata üzenet az NS-AIR Rendszerből.
              </div>
            </div>
          `,
        });

        emailSent = true;
      } catch (mailError) {
        console.error(
          "Email küldési hiba az új munkánál:",
          mailError
        );
      }
    }

    let message =
      "Munka sikeresen elmentve.";

    if (clientSyncResult.created) {
      message +=
        " Az ügyfél automatikusan bekerült az ügyfelek közé.";
    } else if (
      clientSyncResult.reason ===
        "existing-email" ||
      clientSyncResult.reason ===
        "existing-phone" ||
      clientSyncResult.reason ===
        "existing-name-address"
    ) {
      message +=
        " Az ügyfél már szerepelt az ügyfelek között.";
    } else if (
      clientSyncResult.reason ===
      "missing-name"
    ) {
      message +=
        " Ügyfél nem készült, mert nem volt megadva név.";
    } else if (
      clientSyncResult.reason ===
      "client-sync-error"
    ) {
      message +=
        " Az ügyfél automatikus mentése nem sikerült.";
    }

    if (emailSent) {
      message +=
        " Az értesítő email elküldve.";
    } else if (
      notificationEmails.length > 0
    ) {
      message +=
        " Az email elküldése nem sikerült.";
    }

    return NextResponse.json({
      message,
      taskId: newTaskId,
      clientCreated:
        clientSyncResult.created,
      clientId:
        clientSyncResult.client?.id || null,
      emailSent,
      driveLinks: imageUrls,
    });
  } catch (error: any) {
    console.error(
      "Adatbázis mentési hiba részletei:",
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
