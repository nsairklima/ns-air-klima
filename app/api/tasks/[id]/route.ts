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
  console.error("Cloudinary config hiba:", error);
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

function normalizeText(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("hu-HU")
    .replace(/\s+/g, " ");
}

function getPublicIdFromUrl(
  url: string
): string | null {
  try {
    const parts = url.split("/");
    const uploadIndex = parts.indexOf("upload");

    if (uploadIndex === -1) {
      return null;
    }

    const pathSegments = parts.slice(
      uploadIndex + 2
    );

    const fullPath = pathSegments.join("/");
    const lastDotIndex =
      fullPath.lastIndexOf(".");

    return lastDotIndex !== -1
      ? fullPath.substring(0, lastDotIndex)
      : fullPath;
  } catch {
    return null;
  }
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

  /*
   * 1. Ellenőrzés email alapján.
   */
  if (cleanEmail) {
    const emailClient =
      await prisma.client.findFirst({
        where: {
          email: {
            equals: cleanEmail,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
        },
      });

    if (emailClient) {
      return {
        created: false,
        reason: "existing-email",
        clientId: emailClient.id,
      };
    }
  }

  /*
    *2. Ellenőrzés telefonszám alapján.
   *
    *Először lekérjük a telefonszámmal
    *rendelkező ügyfeleket, majd egységes
    *formátumban hasonlítjuk össze.
   */
const normalizedPhone =
  normalizePhone(cleanPhone);

if (normalizedPhone) {
  const clientsWithPhone =
    await prisma.client.findMany({
      where: {
        phone: {
          not: null,
        },
      },
      select: {
        id: true,
        phone: true,
      },
    });

  const phoneClient =
    clientsWithPhone.find((client) => {
      return (
        normalizePhone(client.phone || "") ===
        normalizedPhone
      );
    });

  if (phoneClient) {
    return {
      created: false,
      reason: "existing-phone",
      clientId: phoneClient.id,
    };
  }
}

const clientsWithSameName =
  await prisma.client.findMany({
    where: {
      name: {
        equals: cleanName,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
      address: true,
    },
  });

const normalizedAddress =
  normalizeText(cleanAddress);

  /*
   * Ha cím is van, név és cím alapján
   * keressük a pontos egyezést.
   */
  if (normalizedAddress) {
    const nameAddressClient =
      clientsWithSameName.find((client) => {
        return (
          normalizeText(client.name) ===
            normalizeText(cleanName) &&
          normalizeText(client.address || "") ===
            normalizedAddress
        );
      });

    if (nameAddressClient) {
      return {
        created: false,
        reason: "existing-name-address",
        clientId: nameAddressClient.id,
      };
    }
  }

  /*
   * Ha nincs email, telefonszám és cím,
   * a pontos névegyezést használjuk.
   */
  if (
    !cleanEmail &&
    !normalizedPhone &&
    !normalizedAddress &&
    clientsWithSameName.length > 0
  ) {
    return {
      created: false,
      reason: "existing-name",
      clientId: clientsWithSameName[0].id,
    };
  }

  /*
    * Nem találtunk meglévő ügyfelet,
   * ezért létrehozzuk.
   */
  const newClient =
    await prisma.client.create({
      data: {
        name: cleanName,
        address: cleanAddress || null,
        phone: cleanPhone || null,
        email: cleanEmail || null,
        notes: cleanNote
          ? cleanNote +
            "\n\nAutomatikusan létrehozva munka szerkesztésekor."
          : "Automatikusan létrehozva munka szerkesztésekor.",
      },
      select: {
        id: true,
        name: true,
      },
    });

  console.log(
    "Új ügyfél létrehozva szerkesztéskor:",
    newClient
  );

  return {
    created: true,
    reason: "created",
    clientId: newClient.id,
  };
}

export async function DELETE(
  request: Request,
  props: {
    params:
      | Promise<{ id: string }>
      | { id: string };
  }
) {
  try {
    const params = await props.params;
    const taskId = params.id;

    const existingTask = await sql`
      SELECT "images"
      FROM "Task"
      WHERE "id" = ${taskId}
    `;

    if (
      existingTask.length > 0 &&
      existingTask[0].images
    ) {
      let images: string[] = [];

      try {
        images =
          typeof existingTask[0].images ===
          "string"
            ? JSON.parse(
                existingTask[0].images
              )
            : existingTask[0].images;
      } catch {
        images = [];
      }

      for (const imageUrl of images) {
        const publicId =
          getPublicIdFromUrl(imageUrl);

        if (!publicId) {
          continue;
        }

        try {
          await cloudinary.uploader.destroy(
            publicId
          );
        } catch (error) {
          console.error(
            "Hiba a kép Cloudinary törlésekor:",
            error
          );
        }
      }
    }

    await sql`
      DELETE FROM "Task"
      WHERE "id" = ${taskId}
    `;

    return NextResponse.json({
      message:
        "Sikeres törlés és fájlok eltávolítása",
    });
  } catch (error: any) {
    console.error("Törlési hiba:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Törlési hiba",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(
  request: Request,
  props: {
    params:
      | Promise<{ id: string }>
      | { id: string };
  }
) {
  try {
    const params = await props.params;
    const taskId = params.id;

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

    /*
    *  Email-címzettek feldolgozása.
     */
    const recipientsRaw =
      cleanText(
        formData.get("recipients")
      );

    let notificationEmails: string[] = [];

    if (recipientsRaw) {
      try {
        const parsedRecipients =
          JSON.parse(recipientsRaw);

        if (Array.isArray(parsedRecipients)) {
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
            .map((item) => item.trim())
            .filter(Boolean);
      }
    }

    if (notificationEmails.length === 0) {
      const environmentEmails =
        process.env.NOTIFICATION_EMAILS ||
        process.env.EMAIL_USER ||
        "";

      notificationEmails =
        environmentEmails
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
    }

    /*
    *  Időpontok feldolgozása.
     */
    const scheduledAtRaw =
      cleanText(
        formData.get("scheduledAt")
      );

    const completedAtRaw =
      cleanText(
        formData.get("completedAt")
      );

    const scheduledAt = scheduledAtRaw
      ? scheduledAtRaw.replace("T", " ")
      : null;

    const completedAt = completedAtRaw
      ? completedAtRaw.replace("T", " ")
      : null;

    const taskTitle =
      name || "Módosított munka";

    const description = note
      ? email
        ? `${note} | Email: ${email}`
        : note
      : email
        ? `Email: ${email}`
        : "";

    /*
     * Jelenlegi képek lekérése.
     */
    const currentTasks = await sql`
      SELECT "images"
      FROM "Task"
      WHERE "id" = ${taskId}
    `;

    if (currentTasks.length === 0) {
      return NextResponse.json(
        {
          error:
            "A szerkesztendő munka nem található.",
        },
        {
          status: 404,
        }
      );
    }

    let oldImagesInDb: string[] = [];

    if (currentTasks[0].images) {
      try {
        oldImagesInDb =
          typeof currentTasks[0].images ===
          "string"
            ? JSON.parse(
                currentTasks[0].images
              )
            : currentTasks[0].images;
      } catch {
        oldImagesInDb = [];
      }
    }

    /*
     * Megtartandó képek feldolgozása.
     */
    let keptImages: string[] = [];

    const existingImagesRaw =
      cleanText(
        formData.get("existingImages")
      );

    if (existingImagesRaw) {
      try {
        const parsedImages =
          JSON.parse(existingImagesRaw);

        if (Array.isArray(parsedImages)) {
          keptImages = parsedImages;
        }
      } catch {
        keptImages = [];
      }
    }

    /*
     * Eltávolított képek törlése.
     */
    const imagesToDelete =
      oldImagesInDb.filter((imageUrl) => {
        return !keptImages.includes(
          imageUrl
        );
      });

    for (const imageUrl of imagesToDelete) {
      const publicId =
        getPublicIdFromUrl(imageUrl);

      if (!publicId) {
        continue;
      }

      try {
        await cloudinary.uploader.destroy(
          publicId
        );
      } catch (error) {
        console.error(
          "Hiba a régi kép törlésekor:",
          error
        );
      }
    }

    /*
     * Új képek feltöltése.
     */
    const photos =
      formData.getAll("photos") as File[];

    const newImageUrls: string[] = [];

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
          newImageUrls.push(
            uploadResult.secure_url
          );
        }
      } catch (uploadError: any) {
        console.error(
          "Képfeltöltési hiba szerkesztéskor:",
          uploadError?.message ||
            uploadError
        );
      }
    }

    const finalImages = [
      ...keptImages,
      ...newImageUrls,
    ];

    /*
     * Munka frissítése.
     */
    const updatedTasks = await sql`
      UPDATE "Task"
      SET
        "type" = ${type},
        "title" = ${taskTitle},
        "clientName" = ${name},
        "address" = ${address},
        "phone" = ${phone},
        "description" = ${description},
        "images" = ${JSON.stringify(
          finalImages
        )},
        "scheduled_at" = ${scheduledAt},
        "completed_at" = ${completedAt},
        "updatedAt" = NOW()
      WHERE "id" = ${taskId}
      RETURNING "id"
    `;

    if (updatedTasks.length === 0) {
      return NextResponse.json(
        {
          error:
            "A munka frissítése nem sikerült.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Ügyfél ellenőrzése és szükség esetén
     * automatikus létrehozása.
     */
    let clientSyncResult:
      | ClientSyncResult
      | null = null;

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
        "Ügyfélszinkronizálási hiba szerkesztéskor:",
        clientError
      );

      return NextResponse.json(
        {
          error:
            "A munka frissült, de az ügyfél mentése nem sikerült: " +
            (clientError?.message ||
              String(clientError)),
          taskId,
          images: finalImages,
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
            `✏️ Munka módosítva: ${typeLabel} ` +
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
                  background-color: #f39c12;
                  color: white;
                  padding: 20px;
                  text-align: center;
                "
              >
                <h2 style="margin: 0;">
                  Egy munka adatai frissültek
                </h2>

                <p style="margin: 6px 0 0;">
                  ${typeLabel}
                </p>
              </div>

              <div style="padding: 20px;">
                <p>
                  <strong>Munkaazonosító:</strong>
                  #${taskId}
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
                  <strong>Megvalósult időpont:</strong>
                                    ${completedAt || "-"}
                </p>

                <p>
                  <strong>Megjegyzés:</strong>
                  ${note || "-"}
                </p>
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
          "Email küldési hiba módosításkor:",
          mailError
        );
      }
    }

    let message =
      "Munka sikeresen módosítva.";

    if (clientSyncResult?.created) {
      message +=
        " Az ügyfél automatikusan bekerült az ügyfelek közé.";
    } else if (
      clientSyncResult?.reason ===
      "missing-name"
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
      taskId,
      images: finalImages,
      clientCreated:
        clientSyncResult?.created || false,
      clientId:
        clientSyncResult?.clientId || null,
      clientMatchReason:
        clientSyncResult?.reason || null,
      emailSent,
    });
  } catch (error: any) {
    console.error(
      "Szerkesztési hiba részletei:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Szerkesztési hiba",
      },
      {
        status: 500,
      }
    );
  }
}
    
