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
  console.error(
    "Cloudinary konfigurációs hiba:",
    error
  );
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

type AirConditionerInput = {
  name: string;
  warranty: boolean;
  washing: boolean;
  disinfection: boolean;
  washingPrice: number;
  disinfectionPrice: number;
  paymentMethod: "cash" | "transfer";
};

function cleanText(value: unknown): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string): string {
  return value.replace(/[^0-9+]/g, "");
}

function normalizeGeneralText(
  value: string
): string {
  return value
    .trim()
    .toLocaleLowerCase("hu-HU")
    .replace(/\s+/g, " ");
}

function parseCoordinate(
  value: FormDataEntryValue | null
): number | null {
  const rawValue = cleanText(value);

  if (!rawValue) {
    return null;
  }

  const parsedValue = Number(rawValue);

  return Number.isFinite(parsedValue)
    ? parsedValue
    : null;
}

function parseNonNegativeInteger(
  value: unknown
): number {
  const parsedValue = Number(value);

  if (
    !Number.isFinite(parsedValue) ||
    parsedValue < 0
  ) {
    return 0;
  }

  return Math.round(parsedValue);
}

function parseAirConditioners(
  rawValue: FormDataEntryValue | null
): AirConditionerInput[] {
  const textValue = cleanText(rawValue);

  if (!textValue) {
    return [];
  }

  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(textValue);
  } catch {
    throw new Error(
      "A klímaadatok JSON formátuma hibás."
    );
  }

  if (!Array.isArray(parsedValue)) {
    throw new Error(
      "A klímaadatok nem megfelelő formátumban érkeztek."
    );
  }

  return parsedValue.map(
    (item: any, index: number) => {
      const warranty =
        item?.warranty === true;

      const washing =
        item?.washing === true;

      const disinfection =
        item?.disinfection === true;

      const washingPrice = washing
        ? parseNonNegativeInteger(
            item?.washingPrice
          )
        : 0;

      const disinfectionPrice =
        disinfection
          ? parseNonNegativeInteger(
              item?.disinfectionPrice
            )
          : 0;

      const rawPaymentMethod =
        cleanText(item?.paymentMethod);

      if (!washing && !disinfection) {
        throw new Error(
          `${index + 1}. klíma: válassz legalább egy elvégzett munkát.`
        );
      }

      if (
        rawPaymentMethod !== "cash" &&
        rawPaymentMethod !== "transfer"
      ) {
        throw new Error(
          `${index + 1}. klíma: válassz fizetési módot.`
        );
      }

      return {
        name: cleanText(item?.name),
        warranty,
        washing,
        disinfection,
        washingPrice,
        disinfectionPrice,
        paymentMethod: rawPaymentMethod,
      };
    }
  );
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatPrice(value: number): string {
  return (
    new Intl.NumberFormat("hu-HU").format(
      value
    ) + " Ft"
  );
}

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

  const cleanEmail = normalizeEmail(
    cleanText(email)
  );

  const cleanNote = cleanText(note);

  if (!cleanName) {
    return {
      created: false,
      reason: "missing-name",
    };
  }

  const possibleClients =
    await prisma.client.findMany({
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

  if (cleanEmail) {
    const emailMatch =
      possibleClients.find((client) => {
        return (
          normalizeEmail(client.email || "") ===
          cleanEmail
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

  const normalizedPhone =
    normalizePhone(cleanPhone);

  if (normalizedPhone) {
    const phoneMatch =
      possibleClients.find((client) => {
        return (
          normalizePhone(
            client.phone || ""
          ) === normalizedPhone
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

  const normalizedName =
    normalizeGeneralText(cleanName);

  const normalizedAddress =
    normalizeGeneralText(cleanAddress);

  if (normalizedAddress) {
    const nameAddressMatch =
      possibleClients.find((client) => {
        return (
          normalizeGeneralText(
            client.name
          ) === normalizedName &&
          normalizeGeneralText(
            client.address || ""
          ) === normalizedAddress
        );
      });

    if (nameAddressMatch) {
      return {
        created: false,
        reason:
          "existing-name-address",
        clientId: nameAddressMatch.id,
      };
    }
  }

  if (
    !cleanEmail &&
    !normalizedPhone &&
    !normalizedAddress
  ) {
    const nameMatch =
      possibleClients.find((client) => {
        return (
          normalizeGeneralText(
            client.name
          ) === normalizedName
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

  const newClient =
    await prisma.client.create({
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

export async function POST(
  request: Request
) {
  let createdTaskId: number | null = null;

  try {
    const formData =
      await request.formData();

    const type =
      cleanText(formData.get("type")) ||
      "telepites";

    const name =
      cleanText(formData.get("name"));

    const address =
      cleanText(formData.get("address"));

    const phone =
      cleanText(formData.get("phone"));

    const email =
      cleanText(formData.get("email"));

    const note =
      cleanText(formData.get("note"));

    const latitude = parseCoordinate(
      formData.get("latitude")
    );

    const longitude = parseCoordinate(
      formData.get("longitude")
    );

    const airConditioners =
      parseAirConditioners(
        formData.get("airConditioners")
      );

    console.log(
      "Frontendről érkező koordináták:",
      {
        address,
        latitude,
        longitude,
      }
    );

    console.log(
      "Frontendről érkező klímák:",
      airConditioners
    );

    const recipientsRaw = cleanText(
      formData.get("recipients")
    );

    let notificationEmails: string[] = [];

    if (recipientsRaw) {
      try {
        const parsedRecipients =
          JSON.parse(recipientsRaw);

        if (
          Array.isArray(parsedRecipients)
        ) {
          notificationEmails =
            parsedRecipients
              .map((item) =>
                cleanText(item)
              )
              .filter(Boolean);
        }
      } catch {
        notificationEmails =
          recipientsRaw
            .split(",")
            .map((item) =>
              item.trim()
            )
            .filter(Boolean);
      }
    }

    if (
      notificationEmails.length === 0
    ) {
      const environmentEmails =
        process.env
          .NOTIFICATION_EMAILS ||
        process.env.EMAIL_USER ||
        "";

      notificationEmails =
        environmentEmails
          .split(",")
          .map((item) =>
            item.trim()
          )
          .filter(Boolean);
    }

    const scheduledAtRaw = cleanText(
      formData.get("scheduledAt")
    );

    const completedAtRaw = cleanText(
      formData.get("completedAt")
    );

    const scheduledAt =
      scheduledAtRaw
        ? scheduledAtRaw
            .slice(0, 19)
            .replace("T", " ")
        : null;

    const completedAt =
      completedAtRaw
        ? completedAtRaw
            .slice(0, 19)
            .replace("T", " ")
        : null;

    console.log("POST időpontok:", {
      scheduledAtRaw,
      scheduledAt,
      completedAtRaw,
      completedAt,
    });

    const photos =
      formData.getAll(
        "photos"
      ) as File[];

    const imageUrls: string[] = [];

    for (const photo of photos) {
      if (!photo || photo.size <= 0) {
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
                cloudinary.uploader
                  .upload_stream(
                    {
                      folder: "tasks",
                      resource_type:
                        "auto",
                    },
                    (
                      uploadError,
                      result
                    ) => {
                      if (uploadError) {
                        reject(
                          uploadError
                        );
                        return;
                      }

                      resolve(result);
                    }
                  );

              uploadStream.end(buffer);
            }
          );

        if (
          uploadResult?.secure_url
        ) {
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
        "clientName",
        "latitude",
        "longitude"
    `;

    const rawTaskId =
      insertedTasks[0]?.id;

    const newTaskId =
      Number(rawTaskId);

    if (
      !Number.isFinite(newTaskId)
    ) {
      throw new Error(
        "A munka létrejött, de az azonosítója nem olvasható."
      );
    }

    createdTaskId = newTaskId;

    console.log(
      "Munka létrehozva:",
      {
        id: newTaskId,
        latitude:
          insertedTasks[0]?.latitude,
        longitude:
          insertedTasks[0]?.longitude,
      }
    );

    for (
      let index = 0;
      index < airConditioners.length;
      index += 1
    ) {
      const airConditioner =
        airConditioners[index];

      await sql`
        INSERT INTO "TaskAirConditioner" (
          "taskId",
          "name",
          "warranty",
          "washing",
          "disinfection",
          "washingPrice",
          "disinfectionPrice",
          "paymentMethod",
          "createdAt",
          "updatedAt"
        )
        VALUES (
          ${newTaskId},
          ${airConditioner.name || null},
          ${airConditioner.warranty},
          ${airConditioner.washing},
          ${airConditioner.disinfection},
          ${airConditioner.washingPrice},
          ${airConditioner.disinfectionPrice},
          ${airConditioner.paymentMethod},
          NOW(),
          NOW()
        )
      `;
    }

    console.log(
      "Klímák sikeresen elmentve:",
      {
        taskId: newTaskId,
        count:
          airConditioners.length,
      }
    );

    let clientSyncResult:
      ClientSyncResult;

    try {
      clientSyncResult =
        await createClientIfMissing({
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
            "A munka és a klímák létrejöttek, de az ügyfél mentése nem sikerült: " +
            (clientError?.message ||
              String(clientError)),
          taskId: newTaskId,
          airConditionerCount:
            airConditioners.length,
          clientCreated: false,
        },
        {
          status: 500,
        }
      );
    }

    const totalPrice =
      airConditioners.reduce(
        (
          total,
          airConditioner
        ) => {
          return (
            total +
            (airConditioner.washing
              ? airConditioner.washingPrice
              : 0) +
            (airConditioner.disinfection
              ? airConditioner.disinfectionPrice
              : 0)
          );
        },
        0
      );

    const airConditionersHtml =
      airConditioners.length > 0
        ? airConditioners
            .map(
              (
                airConditioner,
                index
              ) => {
                const itemTotal =
                  (airConditioner.washing
                    ? airConditioner.washingPrice
                    : 0) +
                  (airConditioner.disinfection
                    ? airConditioner.disinfectionPrice
                    : 0);

                const workTypes = [
                  airConditioner.washing
                    ? "Mosás"
                    : "",
                  airConditioner.disinfection
                    ? "Fertőtlenítés"
                    : "",
                ]
                  .filter(Boolean)
                  .join(", ");

                const paymentLabel =
                  airConditioner.paymentMethod ===
                  "cash"
                    ? "Készpénz"
                    : "Utalás";

                return `
                  <div
                    style="
                      background: #f8fafc;
                      border: 1px solid #dbe3ea;
                      border-radius: 8px;
                      padding: 12px;
                      margin-bottom: 10px;
                    "
                  >
                    <p style="margin: 0 0 8px;">
                      <strong>
                        Klíma ${index + 1}${
                          airConditioner.name
                            ? `: ${escapeHtml(
                                airConditioner.name
                              )}`
                            : ""
                        }
                      </strong>
                    </p>

                    <p style="margin: 4px 0;">
                      <strong>Garanciás:</strong>
                      ${
                        airConditioner.warranty
                          ? "Igen"
                          : "Nem"
                      }
                    </p>

                    <p style="margin: 4px 0;">
                      <strong>Elvégzett munka:</strong>
                      ${escapeHtml(workTypes)}
                    </p>

                    ${
                      airConditioner.washing
                        ? `
                          <p style="margin: 4px 0;">
                            <strong>Mosás díja:</strong>
                            ${escapeHtml(
                              formatPrice(
                                airConditioner.washingPrice
                              )
                            )}
                          </p>
                        `
                        : ""
                    }

                    ${
                      airConditioner.disinfection
                        ? `
                          <p style="margin: 4px 0;">
                            <strong>Fertőtlenítés díja:</strong>
                            ${escapeHtml(
                              formatPrice(
                                airConditioner.disinfectionPrice
                              )
                            )}
                          </p>
                        `
                        : ""
                    }

                    <p style="margin: 4px 0;">
                      <strong>Fizetési mód:</strong>
                      ${paymentLabel}
                    </p>

                    <p
                      style="
                        margin: 8px 0 0;
                        padding-top: 8px;
                        border-top: 1px solid #dbe3ea;
                        color: #1e8449;
                        font-weight: bold;
                      "
                    >
                      Klíma összege:
                      ${escapeHtml(
                        formatPrice(itemTotal)
                      )}
                    </p>
                  </div>
                `;
              }
            )
            .join("")
        : `
            <p style="color: #777;">
              Ehhez a munkához nem lett klíma rögzítve.
            </p>
          `;

    let emailSent = false;

    if (
      notificationEmails.length > 0
    ) {
      try {
        const transporter =
          nodemailer.createTransport({
            host:
              process.env.EMAIL_HOST,
            port: Number(
              process.env.EMAIL_PORT
            ),
            secure: true,
            auth: {
              user:
                process.env.EMAIL_USER,
              pass:
                process.env.EMAIL_PASS,
            },
            tls: {
              rejectUnauthorized:
                false,
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

              <div
                style="
                  padding: 20px;
                  color: #333;
                "
              >
                <p>
                  <strong>
                    Munkaazonosító:
                  </strong>
                  #${newTaskId}
                </p>

                <p>
                  <strong>Név:</strong>
                  ${escapeHtml(name || "-")}
                </p>

                <p>
                  <strong>Cím:</strong>
                  ${escapeHtml(address || "-")}
                </p>

                <p>
                  <strong>Telefon:</strong>
                  ${escapeHtml(phone || "-")}
                </p>

                <p>
                  <strong>Email:</strong>
                  ${escapeHtml(email || "-")}
                </p>

                <p>
                  <strong>
                    Tervezett időpont:
                  </strong>
                  ${escapeHtml(
                    scheduledAt || "-"
                  )}
                </p>

                <p>
                  <strong>
                    Megvalósult időpont:
                  </strong>
                  ${escapeHtml(
                    completedAt || "-"
                  )}
                </p>

                <p>
                  <strong>
                    Megjegyzés:
                  </strong>
                  ${escapeHtml(note || "-")}
                </p>

                <div
                  style="
                    border-top: 1px solid #ddd;
                    margin-top: 18px;
                    padding-top: 16px;
                  "
                >
                  <h3
                    style="
                      margin: 0 0 12px;
                      color: #2c3e50;
                    "
                  >
                    Rögzített klímák
                  </h3>

                  ${airConditionersHtml}

                  ${
                    airConditioners.length >
                    0
                      ? `
                        <div
                          style="
                            background: #eafaf1;
                            border: 1px solid #27ae60;
                            border-radius: 8px;
                            padding: 12px;
                            margin-top: 12px;
                            color: #1e8449;
                            font-weight: bold;
                          "
                        >
                          Klímák száma:
                          ${airConditioners.length} db
                          <br>
                          Teljes összeg:
                          ${escapeHtml(
                            formatPrice(
                              totalPrice
                            )
                          )}
                        </div>
                      `
                      : ""
                  }
                </div>
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
                Automata üzenet az
                NS-AIR Rendszerből.
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

    let message =
      "Munka sikeresen elmentve.";

    if (airConditioners.length > 0) {
      message +=
        ` ${airConditioners.length} klíma elmentve.`;
    }

    if (clientSyncResult.created) {
      message +=
        " Az ügyfél automatikusan bekerült az ügyfelek közé.";
    } else if (
      clientSyncResult.reason ===
      "missing-name"
    ) {
      message +=
        " Ügyfél nem készült, mert nincs megadva név.";
    } else {
      message +=
        " Az ügyfél már szerepel az ügyfelek között.";
    }

    if (latitude === null) {
      message +=
        " A címhez nem érkezett koordináta.";
    }

    if (emailSent) {
      message +=
        " Az értesítő email elküldve.";
    }

    return NextResponse.json({
      message,
      taskId: newTaskId,
      airConditionerCount:
        airConditioners.length,
      totalPrice,
      clientCreated:
        clientSyncResult.created,
      clientId:
        clientSyncResult.clientId ||
        null,
      clientMatchReason:
        clientSyncResult.reason,
      emailSent,
      latitude,
      longitude,
      driveLinks: imageUrls,
    });
  } catch (error: any) {
    console.error(
      "Munka mentési hiba:",
      error
    );

    /*
     * Ha a Task létrejött, de a klímák mentése
     * közben hiba történt, eltávolítjuk a félkész
     * munkát. Az ON DELETE CASCADE miatt az addig
     * létrejött klímák is törlődnek.
     */
    if (createdTaskId !== null) {
      try {
        await sql`
          DELETE FROM "Task"
          WHERE "id" = ${createdTaskId}
        `;

        console.log(
          "Félkész munka visszavonva:",
          createdTaskId
        );
      } catch (rollbackError) {
        console.error(
          "A félkész munka visszavonása nem sikerült:",
          rollbackError
        );
      }
    }

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
