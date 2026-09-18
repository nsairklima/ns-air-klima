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

type AirConditionerInput = {
  id?: number;
  name: string;
  warranty: boolean;
  washing: boolean;
  disinfection: boolean;
  washingPrice: number;
  disinfectionPrice: number;
  paymentMethod: "cash" | "transfer";
};

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string): string {
  return value.replace(/[^0-9+]/g, "");
}

function normalizeText(value: string): string {
  return value.trim().toLocaleLowerCase("hu-HU").replace(/\s+/g, " ");
}

function parseNonNegativeInteger(value: unknown): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0
    ? Math.round(numberValue)
    : 0;
}

function parseAirConditioners(
  value: FormDataEntryValue | null
): AirConditionerInput[] {
  const raw = cleanText(value);
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("A klímaadatok JSON formátuma hibás.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("A klímaadatok nem megfelelő formátumban érkeztek.");
  }

  return parsed.map((item: any, index: number) => {
    const washing = item?.washing === true;
    const disinfection = item?.disinfection === true;
    const paymentMethod = cleanText(item?.paymentMethod);

    if (!washing && !disinfection) {
      throw new Error(
        `${index + 1}. klíma: válassz legalább egy elvégzett munkát.`
      );
    }

    if (paymentMethod !== "cash" && paymentMethod !== "transfer") {
      throw new Error(`${index + 1}. klíma: válassz fizetési módot.`);
    }

    const parsedId = Number(item?.id);

    return {
      ...(Number.isInteger(parsedId) && parsedId > 0 ? { id: parsedId } : {}),
      name: cleanText(item?.name),
      warranty: item?.warranty === true,
      washing,
      disinfection,
      washingPrice: washing
        ? parseNonNegativeInteger(item?.washingPrice)
        : 0,
      disinfectionPrice: disinfection
        ? parseNonNegativeInteger(item?.disinfectionPrice)
        : 0,
      paymentMethod,
    };
  });
}

function getPublicIdFromUrl(url: string): string | null {
  try {
    const parts = url.split("/");
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return null;

    const pathSegments = parts.slice(uploadIndex + 2);
    const fullPath = pathSegments.join("/");
    const lastDotIndex = fullPath.lastIndexOf(".");

    return lastDotIndex !== -1
      ? fullPath.substring(0, lastDotIndex)
      : fullPath;
  } catch {
    return null;
  }
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
  return new Intl.NumberFormat("hu-HU").format(value) + " Ft";
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
  const cleanEmail = normalizeEmail(cleanText(email));
  const cleanNote = cleanText(note);

  if (!cleanName) return { created: false, reason: "missing-name" };

  if (cleanEmail) {
    const client = await prisma.client.findFirst({
      where: { email: { equals: cleanEmail, mode: "insensitive" } },
      select: { id: true },
    });
    if (client) {
      return { created: false, reason: "existing-email", clientId: client.id };
    }
  }

  const normalizedPhone = normalizePhone(cleanPhone);
  if (normalizedPhone) {
    const clients = await prisma.client.findMany({
      where: { phone: { not: null } },
      select: { id: true, phone: true },
    });
    const client = clients.find(
      (item) => normalizePhone(item.phone || "") === normalizedPhone
    );
    if (client) {
      return { created: false, reason: "existing-phone", clientId: client.id };
    }
  }

  const sameName = await prisma.client.findMany({
    where: { name: { equals: cleanName, mode: "insensitive" } },
    select: { id: true, name: true, address: true },
  });

  const normalizedAddress = normalizeText(cleanAddress);
  if (normalizedAddress) {
    const client = sameName.find(
      (item) =>
        normalizeText(item.name) === normalizeText(cleanName) &&
        normalizeText(item.address || "") === normalizedAddress
    );
    if (client) {
      return {
        created: false,
        reason: "existing-name-address",
        clientId: client.id,
      };
    }
  }

  if (!cleanEmail && !normalizedPhone && !normalizedAddress && sameName.length) {
    return {
      created: false,
      reason: "existing-name",
      clientId: sameName[0].id,
    };
  }

  const newClient = await prisma.client.create({
    data: {
      name: cleanName,
      address: cleanAddress || null,
      phone: cleanPhone || null,
      email: cleanEmail || null,
      notes: cleanNote
        ? cleanNote + "\n\nAutomatikusan létrehozva munka szerkesztésekor."
        : "Automatikusan létrehozva munka szerkesztésekor.",
    },
    select: { id: true },
  });

  return { created: true, reason: "created", clientId: newClient.id };
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await props.params;
    const taskId = Number(params.id);

    if (!Number.isInteger(taskId) || taskId <= 0) {
      return NextResponse.json({ error: "Érvénytelen munkaazonosító." }, { status: 400 });
    }

    const existingTask = await sql`
      SELECT "images" FROM "Task" WHERE "id" = ${taskId}
    `;

    if (existingTask.length === 0) {
      return NextResponse.json({ error: "A munka nem található." }, { status: 404 });
    }

    let images: string[] = [];
    if (existingTask[0].images) {
      try {
        images =
          typeof existingTask[0].images === "string"
            ? JSON.parse(existingTask[0].images)
            : existingTask[0].images;
        if (!Array.isArray(images)) images = [];
      } catch {
        images = [];
      }
    }

    for (const imageUrl of images) {
      const publicId = getPublicIdFromUrl(imageUrl);
      if (!publicId) continue;
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error("Hiba a kép Cloudinary törlésekor:", error);
      }
    }

    await sql`DELETE FROM "Task" WHERE "id" = ${taskId}`;

    return NextResponse.json({
      message: "Sikeres törlés. A kapcsolódó klímák is törlődtek.",
    });
  } catch (error: any) {
    console.error("Törlési hiba:", error);
    return NextResponse.json(
      { error: error?.message || "Törlési hiba" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await props.params;
    const taskId = Number(params.id);

    if (!Number.isInteger(taskId) || taskId <= 0) {
      return NextResponse.json({ error: "Érvénytelen munkaazonosító." }, { status: 400 });
    }

    const formData = await request.formData();
    const type = cleanText(formData.get("type")) || "telepites";
    const name = cleanText(formData.get("name"));
    const address = cleanText(formData.get("address"));
    const phone = cleanText(formData.get("phone"));
    const email = cleanText(formData.get("email"));
    const note = cleanText(formData.get("note"));
    const airConditioners = parseAirConditioners(
      formData.get("airConditioners")
    );

    const latitudeRaw = cleanText(formData.get("latitude"));
    const longitudeRaw = cleanText(formData.get("longitude"));
    const parsedLatitude = latitudeRaw ? Number(latitudeRaw) : null;
    const parsedLongitude = longitudeRaw ? Number(longitudeRaw) : null;
    const latitude =
      parsedLatitude !== null && Number.isFinite(parsedLatitude)
        ? parsedLatitude
        : null;
    const longitude =
      parsedLongitude !== null && Number.isFinite(parsedLongitude)
        ? parsedLongitude
        : null;

    const recipientsRaw = cleanText(formData.get("recipients"));
    let notificationEmails: string[] = [];

    if (recipientsRaw) {
      try {
        const parsed = JSON.parse(recipientsRaw);
        if (Array.isArray(parsed)) {
          notificationEmails = parsed.map(cleanText).filter(Boolean);
        }
      } catch {
        notificationEmails = recipientsRaw
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }

    if (!notificationEmails.length) {
      notificationEmails = (
        process.env.NOTIFICATION_EMAILS || process.env.EMAIL_USER || ""
      )
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    const scheduledAtRaw = cleanText(formData.get("scheduledAt"));
    const completedAtRaw = cleanText(formData.get("completedAt"));
    const scheduledAt = scheduledAtRaw
      ? scheduledAtRaw.slice(0, 19).replace("T", " ")
      : null;
    const completedAt = completedAtRaw
      ? completedAtRaw.slice(0, 19).replace("T", " ")
      : null;

    const currentTasks = await sql`
      SELECT "images" FROM "Task" WHERE "id" = ${taskId}
    `;

    if (!currentTasks.length) {
      return NextResponse.json(
        { error: "A szerkesztendő munka nem található." },
        { status: 404 }
      );
    }

    let oldImagesInDb: string[] = [];
    try {
      oldImagesInDb =
        typeof currentTasks[0].images === "string"
          ? JSON.parse(currentTasks[0].images)
          : currentTasks[0].images || [];
      if (!Array.isArray(oldImagesInDb)) oldImagesInDb = [];
    } catch {
      oldImagesInDb = [];
    }

    let keptImages: string[] = [];
    const existingImagesRaw = cleanText(formData.get("existingImages"));
    if (existingImagesRaw) {
      try {
        const parsed = JSON.parse(existingImagesRaw);
        keptImages = Array.isArray(parsed) ? parsed : [];
      } catch {
        keptImages = [];
      }
    }

    for (const imageUrl of oldImagesInDb.filter(
      (imageUrl) => !keptImages.includes(imageUrl)
    )) {
      const publicId = getPublicIdFromUrl(imageUrl);
      if (!publicId) continue;
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error("Hiba a régi kép törlésekor:", error);
      }
    }

    const photos = formData.getAll("photos") as File[];
    const newImageUrls: string[] = [];

    for (const photo of photos) {
      if (!photo || photo.size <= 0) continue;
      try {
        const buffer = Buffer.from(await photo.arrayBuffer());
        const uploadResult = await new Promise<any>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "tasks", resource_type: "auto" },
            (uploadError, result) => {
              if (uploadError) reject(uploadError);
              else resolve(result);
            }
          );
          stream.end(buffer);
        });
        if (uploadResult?.secure_url) newImageUrls.push(uploadResult.secure_url);
      } catch (error) {
        console.error("Képfeltöltési hiba szerkesztéskor:", error);
      }
    }

    const finalImages = [...keptImages, ...newImageUrls];
    const description = note
      ? email
        ? `${note} | Email: ${email}`
        : note
      : email
        ? `Email: ${email}`
        : "";

    await sql`BEGIN`;
    try {
      const updatedTasks = await sql`
        UPDATE "Task"
        SET
          "type" = ${type},
          "title" = ${name || "Módosított munka"},
          "clientName" = ${name},
          "address" = ${address},
          "phone" = ${phone},
          "description" = ${description},
          "images" = ${JSON.stringify(finalImages)},
          "scheduled_at" = ${scheduledAt},
          "completed_at" = ${completedAt},
          "latitude" = ${latitude},
          "longitude" = ${longitude},
          "updatedAt" = NOW()
        WHERE "id" = ${taskId}
        RETURNING "id"
      `;

      if (!updatedTasks.length) {
        throw new Error("A munka frissítése nem sikerült.");
      }

      await sql`DELETE FROM "TaskAirConditioner" WHERE "taskId" = ${taskId}`;

      for (const item of airConditioners) {
        await sql`
          INSERT INTO "TaskAirConditioner" (
            "taskId", "name", "warranty", "washing", "disinfection",
            "washingPrice", "disinfectionPrice", "paymentMethod",
            "createdAt", "updatedAt"
          ) VALUES (
            ${taskId}, ${item.name || null}, ${item.warranty},
            ${item.washing}, ${item.disinfection}, ${item.washingPrice},
            ${item.disinfectionPrice}, ${item.paymentMethod}, NOW(), NOW()
          )
        `;
      }

      await sql`COMMIT`;
    } catch (error) {
      await sql`ROLLBACK`;
      throw error;
    }

    let clientSyncResult: ClientSyncResult | null = null;
    try {
      clientSyncResult = await createClientIfMissing({
        name,
        address,
        phone,
        email,
        note,
      });
    } catch (error) {
      console.error("Ügyfélszinkronizálási hiba szerkesztéskor:", error);
    }

    const totalPrice = airConditioners.reduce(
      (total, item) =>
        total +
        (item.washing ? item.washingPrice : 0) +
        (item.disinfection ? item.disinfectionPrice : 0),
      0
    );

    let emailSent = false;
    if (notificationEmails.length) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: Number(process.env.EMAIL_PORT),
          secure: true,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          tls: { rejectUnauthorized: false },
        });

        const typeLabel =
          type === "telepites" ? "🛠️ Telepítés" : "🧹 Karbantartás";

        const airConditionersHtml = airConditioners.length
          ? airConditioners
              .map((item, index) => {
                const work = [
                  item.washing ? "Mosás" : "",
                  item.disinfection ? "Fertőtlenítés" : "",
                ]
                  .filter(Boolean)
                  .join(", ");
                const itemTotal =
                  (item.washing ? item.washingPrice : 0) +
                  (item.disinfection ? item.disinfectionPrice : 0);

                return `<div style="padding:10px;margin:8px 0;border:1px solid #ddd;border-radius:8px">
                  <strong>Klíma ${index + 1}${item.name ? `: ${escapeHtml(item.name)}` : ""}</strong><br>
                  Garanciás: ${item.warranty ? "Igen" : "Nem"}<br>
                  Elvégzett munka: ${escapeHtml(work)}<br>
                  Fizetési mód: ${item.paymentMethod === "cash" ? "Készpénz" : "Utalás"}<br>
                  Összeg: ${escapeHtml(formatPrice(itemTotal))}
                </div>`;
              })
              .join("")
          : "<p>Nincs rögzített klíma.</p>";

        await transporter.sendMail({
          from: `"Klíma Rendszer" <${process.env.EMAIL_USER}>`,
          to: notificationEmails,
          subject: `✏️ Munka módosítva: ${typeLabel} (${name || "Névtelen"})`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
            <h2>Egy munka adatai frissültek</h2>
            <p><strong>Munkaazonosító:</strong> #${taskId}</p>
            <p><strong>Név:</strong> ${escapeHtml(name || "-")}</p>
            <p><strong>Cím:</strong> ${escapeHtml(address || "-")}</p>
            <p><strong>Telefon:</strong> ${escapeHtml(phone || "-")}</p>
            <p><strong>Email:</strong> ${escapeHtml(email || "-")}</p>
            <p><strong>Tervezett időpont:</strong> ${escapeHtml(scheduledAt || "-")}</p>
            <p><strong>Megvalósult időpont:</strong> ${escapeHtml(completedAt || "-")}</p>
            <p><strong>Megjegyzés:</strong> ${escapeHtml(note || "-")}</p>
            <h3>Klímák</h3>
            ${airConditionersHtml}
            <p><strong>Teljes összeg: ${escapeHtml(formatPrice(totalPrice))}</strong></p>
          </div>`,
        });
        emailSent = true;
      } catch (error) {
        console.error("Email küldési hiba módosításkor:", error);
      }
    }

    return NextResponse.json({
      message: `Munka sikeresen módosítva. ${airConditioners.length} klíma elmentve.`,
      taskId,
      images: finalImages,
      airConditionerCount: airConditioners.length,
      totalPrice,
      clientCreated: clientSyncResult?.created || false,
      clientId: clientSyncResult?.clientId || null,
      clientMatchReason: clientSyncResult?.reason || null,
      emailSent,
    });
  } catch (error: any) {
    console.error("Szerkesztési hiba részletei:", error);
    return NextResponse.json(
      { error: error?.message || "Szerkesztési hiba" },
      { status: 500 }
    );
  }
}
