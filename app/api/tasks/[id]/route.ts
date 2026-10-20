import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { v2 as cloudinary } from "cloudinary";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { syncMaintenanceSettlement } from "@/lib/maintenanceSettlement";

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

type MachineDetail = {
  maintenanceType:
    | "mosas"
    | "fertotlenites"
    | "";
  warranty: boolean | null;
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
  return value
    .trim()
    .toLocaleLowerCase("hu-HU")
    .replace(/\s+/g, " ");
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

function parseMachines(value: FormDataEntryValue | null): string[] {
  const raw = cleanText(value);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map((item) => cleanText(item)).filter(Boolean)
      : [];
  } catch (error) {
    console.error("A géptípusok feldolgozása sikertelen:", error);
    return [];
  }
}
function parseMachineDetails(
  value: FormDataEntryValue | null,
  taskType: string
): MachineDetail[] | null {
  const raw = cleanText(value);

  /*
   * Ha a frontend még egyáltalán nem küldte el
   * ezt a mezőt, null értéket adunk vissza.
   *
   * Így nem töröljük véletlenül a korábban
   * elmentett gépadatokat.
   */
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(
      (detail): MachineDetail => {
        let maintenanceType:
          MachineDetail["maintenanceType"] =
            "";

        if (
          detail?.maintenanceType ===
            "mosas" ||
          detail?.maintenanceType ===
            "fertotlenites"
        ) {
          maintenanceType =
            detail.maintenanceType;
        }

        let warranty:
          boolean | null = null;

        if (detail?.warranty === true) {
          warranty = true;
        } else if (
          detail?.warranty === false
        ) {
          warranty = false;
        }

        return {
          /*
           * Mosás vagy fertőtlenítés csak
           * karbantartási munkánál marad meg.
           */
          maintenanceType:
            taskType === "karbantartas"
              ? maintenanceType
              : "",

          warranty,
        };
      }
    );
  } catch (error) {
    console.error(
      "A gépek kiegészítő adatainak feldolgozása sikertelen:",
      error
    );

    return null;
  }
}


function parseOptionalNumber(value: FormDataEntryValue | null): number | null {
  const raw = cleanText(value);
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
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

  const normalizedName =
    normalizeText(cleanName);

  const normalizedAddress =
    normalizeText(cleanAddress);

  const normalizedPhone =
    normalizePhone(cleanPhone);

  /*
   * Lekérjük az összes szóba jöhető ügyfelet.
   *
   * Fontos, hogy név alapján akkor is bekerüljön
   * a találatok közé, ha a munkához most lett
   * először email vagy telefonszám megadva.
   */
  const possibleClients =
    await prisma.client.findMany({
      where: {
        OR: [
          {
            name: {
              equals: cleanName,
              mode: "insensitive",
            },
          },

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
        ],
      },

      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        notes: true,
      },
    });

  let matchedClient:
    | (typeof possibleClients)[number]
    | undefined;

  let matchReason:
    | "existing-email"
    | "existing-phone"
    | "existing-name-address"
    | "existing-name"
    | undefined;

  /*
   * 1. Email alapján keresünk.
   */
  if (cleanEmail) {
    matchedClient =
      possibleClients.find((client) => {
        return (
          normalizeEmail(
            client.email || ""
          ) === cleanEmail
        );
      });

    if (matchedClient) {
      matchReason = "existing-email";
    }
  }

  /*
   * 2. Ha email alapján nincs találat,
   * telefon alapján keresünk.
   */
  if (
    !matchedClient &&
    normalizedPhone
  ) {
    matchedClient =
      possibleClients.find((client) => {
        return (
          normalizePhone(
            client.phone || ""
          ) === normalizedPhone
        );
      });

    if (matchedClient) {
      matchReason = "existing-phone";
    }
  }

  /*
   * 3. Ha még nincs találat,
   * név és cím alapján keresünk.
   */
  if (
    !matchedClient &&
    normalizedAddress
  ) {
    matchedClient =
      possibleClients.find((client) => {
        const clientName =
          normalizeText(client.name);

        const clientAddress =
          normalizeText(
            client.address || ""
          );

        return (
          clientName === normalizedName &&
          clientAddress ===
            normalizedAddress
        );
      });

    if (matchedClient) {
      matchReason =
        "existing-name-address";
    }
  }

  /*
   * 4. Ha az ügyfél korábban csak névvel,
   * telefonnal vagy címmel szerepelt,
   * név alapján is megkeressük.
   *
   * Csak akkor használjuk a név szerinti
   * találatot, ha pontosan egy ilyen nevű
   * ügyfél van.
   */
  if (!matchedClient) {
    const nameMatches =
      possibleClients.filter((client) => {
        return (
          normalizeText(client.name) ===
          normalizedName
        );
      });

    if (nameMatches.length === 1) {
      matchedClient = nameMatches[0];
      matchReason = "existing-name";
    }
  }

  /*
   * Ha megtaláltuk a meglévő ügyfelet,
   * a szerkesztett munka kitöltött adatait
   * átvisszük az ügyfélhez.
   *
   * Üres munkamezővel nem töröljük ki
   * a meglévő ügyféladatot.
   */
  if (matchedClient && matchReason) {
    const updateData: {
      name?: string;
      address?: string;
      phone?: string;
      email?: string;
    } = {};

    if (cleanName) {
      updateData.name = cleanName;
    }

    if (cleanAddress) {
      updateData.address = cleanAddress;
    }

    if (cleanPhone) {
      updateData.phone = cleanPhone;
    }

    if (cleanEmail) {
      updateData.email = cleanEmail;
    }

    await prisma.client.update({
      where: {
        id: matchedClient.id,
      },
      data: updateData,
    });

    console.log(
      "Meglévő ügyfél adatai frissítve szerkesztéskor:",
      {
        clientId: matchedClient.id,
        matchReason,
        name: cleanName || null,
        address: cleanAddress || null,
        phone: cleanPhone || null,
        email: cleanEmail || null,
      }
    );

    return {
      created: false,
      reason: matchReason,
      clientId: matchedClient.id,
    };
  }

  /*
   * Ha nem találtunk meglévő ügyfelet,
   * új ügyfelet hozunk létre.
   */
  const newClient =
    await prisma.client.create({
      data: {
        name: cleanName,

        address:
          cleanAddress || null,

        phone:
          cleanPhone || null,

        email:
          cleanEmail || null,

        notes: cleanNote
          ? `${cleanNote}\n\nAutomatikusan létrehozva munka szerkesztésekor.`
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

async function syncMachinesToClient({
  clientId,
  machines,
  scheduledAt,
  completedAt,
}: {
  clientId: number;
  machines: string[];
  scheduledAt: string | null;
  completedAt: string | null;
}) {
  const cleanMachines = machines
    .map((machine) => cleanText(machine))
    .filter(Boolean);

  const createdMachines: string[] = [];
  const existingMachines: string[] = [];

  const clientUnits = await prisma.clientUnit.findMany({
    where: { clientId },
    select: {
      id: true,
      brand: true,
      model: true,
    },
  });

  for (const machineName of cleanMachines) {
    const parts = machineName.split(/\s+/);
    const brand = parts.length > 1 ? parts[0] : "Ismeretlen";
    const model = parts.length > 1 ? parts.slice(1).join(" ") : machineName;
    const normalizedMachineName = normalizeText(machineName);

    const existingUnit = clientUnits.find((unit) => {
      const fullUnitName = normalizeText(`${unit.brand} ${unit.model}`);
      const modelOnly = normalizeText(unit.model);

      return (
        fullUnitName === normalizedMachineName ||
        modelOnly === normalizedMachineName
      );
    });

    if (existingUnit) {
      existingMachines.push(machineName);
      continue;
    }

    await prisma.clientUnit.create({
      data: {
        clientId,
        brand,
        model,
        status: completedAt ? "INSTALLED" : "PENDING",
        installation: scheduledAt
          ? new Date(scheduledAt.replace(" ", "T"))
          : null,
        installedAt: completedAt
          ? new Date(completedAt.replace(" ", "T"))
          : null,
        periodMonths: 12,
        notes: "Automatikusan létrehozva a munkabejegyzés szerkesztésekor.",
      },
    });

    createdMachines.push(machineName);
    clientUnits.push({ id: -1, brand, model });
  }

  return { createdMachines, existingMachines };
}

function getMaintenanceTypeLabel(
  maintenanceType:
    MachineDetail["maintenanceType"]
): string {
  if (maintenanceType === "mosas") {
    return "Mosás";
  }

  if (
    maintenanceType ===
    "fertotlenites"
  ) {
    return "Fertőtlenítés";
  }

  return "Nincs megadva";
}

function getWarrantyLabel(
  warranty: boolean | null
): string {
  if (warranty === true) {
    return "Igen";
  }

  if (warranty === false) {
    return "Nem";
  }

  return "Nincs megadva";
}

function getPaymentMethodLabel(
  paymentMethod: string | null
): string {
  if (paymentMethod === "keszpenz") {
    return "Készpénz";
  }

  if (paymentMethod === "atutalas") {
    return "Átutalás";
  }

  return "Nincs megadva";
}

export async function DELETE(
  request: Request,
  props: {
    params: Promise<{ id: string }> | { id: string };
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

    if (existingTask.length > 0 && existingTask[0].images) {
      let images: string[] = [];

      try {
        images =
          typeof existingTask[0].images === "string"
            ? JSON.parse(existingTask[0].images)
            : existingTask[0].images;
      } catch {
        images = [];
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
    }

    await sql`
      DELETE FROM "Task"
      WHERE "id" = ${taskId}
    `;

    return NextResponse.json({
      message: "Sikeres törlés és fájlok eltávolítása",
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
  props: {
    params: Promise<{ id: string }> | { id: string };
  }
) {
  try {
    const params = await props.params;
    const taskId = params.id;
    const formData = await request.formData();

    const type = cleanText(formData.get("type")) || "telepites";
    const name = cleanText(formData.get("name"));
    const address = cleanText(formData.get("address"));
    const phone = cleanText(formData.get("phone"));
    const email = cleanText(formData.get("email"));
    const note =
  cleanText(formData.get("note"));

const machines =
  parseMachines(
    formData.get("machines")
  );

const incomingMachineDetails =
  parseMachineDetails(
    formData.get("machineDetails"),
    type
  );

const paymentMethodRaw =
  cleanText(
    formData.get("paymentMethod")
  );

const incomingPaymentMethod:
  "keszpenz" |
  "atutalas" |
  null =
    paymentMethodRaw === "keszpenz" ||
    paymentMethodRaw === "atutalas"
      ? paymentMethodRaw
      : null;

const latitude =
  parseOptionalNumber(
    formData.get("latitude")
  );

const longitude =
  parseOptionalNumber(
    formData.get("longitude")
  );
    

    const recipientsRaw = cleanText(formData.get("recipients"));
    let notificationEmails: string[] = [];

    if (recipientsRaw) {
      try {
        const parsedRecipients = JSON.parse(recipientsRaw);
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
        process.env.NOTIFICATION_EMAILS || process.env.EMAIL_USER || "";

      notificationEmails = environmentEmails
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

    const taskTitle = name || "Módosított munka";
    const description = note
      ? email
        ? `${note} | Email: ${email}`
        : note
      : email
        ? `Email: ${email}`
        : "";

   const currentTasks = await sql`
  SELECT
    "images",
    "machineDetails",
    "paymentMethod"
  FROM "Task"
  WHERE "id" = ${taskId}
`;

    if (currentTasks.length === 0) {
      return NextResponse.json(
        { error: "A szerkesztendő munka nem található." },
        { status: 404 }
      );
    }

    let oldImagesInDb: string[] = [];

    if (currentTasks[0].images) {
      try {
        oldImagesInDb =
          typeof currentTasks[0].images === "string"
            ? JSON.parse(currentTasks[0].images)
            : currentTasks[0].images;
      } catch {
        oldImagesInDb = [];
      }
    }

let oldMachineDetails:
  MachineDetail[] = [];

if (currentTasks[0].machineDetails) {
  try {
    const parsedOldDetails =
      typeof currentTasks[0]
        .machineDetails === "string"
        ? JSON.parse(
            currentTasks[0]
              .machineDetails
          )
        : currentTasks[0]
            .machineDetails;

    if (
      Array.isArray(
        parsedOldDetails
      )
    ) {
      oldMachineDetails =
        parsedOldDetails.map(
          (detail): MachineDetail => {
            const maintenanceType =
              detail
                ?.maintenanceType ===
                "mosas" ||
              detail
                ?.maintenanceType ===
                "fertotlenites"
                ? detail.maintenanceType
                : "";

            const warranty =
              detail?.warranty === true
                ? true
                : detail?.warranty === false
                  ? false
                  : null;

            return {
              maintenanceType,
              warranty,
            };
          }
        );
    }
  } catch (error) {
    console.error(
      "A korábbi gépadatok feldolgozása sikertelen:",
      error
    );

    oldMachineDetails = [];
  }
}

const storedPaymentMethod =
  currentTasks[0].paymentMethod ===
    "keszpenz" ||
  currentTasks[0].paymentMethod ===
    "atutalas"
    ? currentTasks[0].paymentMethod
    : null;
    
    let keptImages: string[] = [];
    const existingImagesRaw = cleanText(formData.get("existingImages"));

    if (existingImagesRaw) {
      try {
        const parsedImages = JSON.parse(existingImagesRaw);
        if (Array.isArray(parsedImages)) keptImages = parsedImages;
      } catch {
        keptImages = [];
      }
    }

    const imagesToDelete = oldImagesInDb.filter(
      (imageUrl) => !keptImages.includes(imageUrl)
    );

    for (const imageUrl of imagesToDelete) {
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
        const arrayBuffer = await photo.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
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
        });

        if (uploadResult?.secure_url) {
          newImageUrls.push(uploadResult.secure_url);
        }
      } catch (uploadError: any) {
        console.error(
          "Képfeltöltési hiba szerkesztéskor:",
          uploadError?.message || uploadError
        );
      }
    }

    const finalImages = [...keptImages, ...newImageUrls];

    /*
 * Ha az űrlap elküldte az új gépadatokat,
 * azokat használjuk.
 *
 * Ha nem küldte el, megtartjuk a korábbi
 * adatbázisban lévő értékeket.
 */
const sourceMachineDetails =
  incomingMachineDetails !== null
    ? incomingMachineDetails
    : oldMachineDetails;

/*
 * A kiegészítő lista hosszát hozzáigazítjuk
 * a gépek számához.
 */
const finalMachineDetails:
  MachineDetail[] =
    machines.map((_, index) => {
      const detail =
        sourceMachineDetails[
          index
        ];

      if (!detail) {
        return {
          maintenanceType: "",
          warranty: null,
        };
      }

      return {
        maintenanceType:
          type === "karbantartas"
            ? detail.maintenanceType
            : "",

        warranty:
          detail.warranty,
      };
    });

/*
 * Ha a frontend elküldte a fizetési módot,
 * az új értéket használjuk.
 *
 * Ha még nem küldte el, megtartjuk a
 * korábbi adatbázisértéket.
 */
const finalPaymentMethod =
  incomingPaymentMethod ||
  storedPaymentMethod;

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
"machines" = ${JSON.stringify(
  machines
)},
"machineDetails" = ${JSON.stringify(
  finalMachineDetails
)},
"paymentMethod" = ${finalPaymentMethod},
"scheduled_at" = ${scheduledAt},
        "completed_at" = ${completedAt},
        "latitude" = ${latitude},
        "longitude" = ${longitude},
        "updatedAt" = NOW()
      WHERE "id" = ${taskId}
      RETURNING "id", "latitude", "longitude"
    `;

    if (updatedTasks.length === 0) {
      return NextResponse.json(
        { error: "A munka frissítése nem sikerült." },
        { status: 404 }
      );
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
    } catch (clientError: any) {
      console.error(
        "Ügyfélszinkronizálási hiba szerkesztéskor:",
        clientError
      );

      return NextResponse.json(
        {
          error:
            "A munka frissült, de az ügyfél mentése nem sikerült: " +
            (clientError?.message || String(clientError)),
          taskId,
          images: finalImages,
        },
        { status: 500 }
      );
    }

    let machineSyncResult = {
      createdMachines: [] as string[],
      existingMachines: [] as string[],
    };

    if (clientSyncResult?.clientId && machines.length > 0) {
      try {
        machineSyncResult = await syncMachinesToClient({
          clientId: clientSyncResult.clientId,
          machines,
          scheduledAt,
          completedAt,
        });

        console.log(
          "Szerkesztéskor ügyfélhez rendelt gépek:",
          machineSyncResult
        );
      } catch (machineError) {
        console.error(
          "Szerkesztéskor a gépek ügyfélhez rendelése sikertelen:",
          machineError
        );

        return NextResponse.json(
          {
            error:
              "A munka frissült, de a gépeket nem sikerült az ügyfélhez rendelni.",
            taskId,
            clientId: clientSyncResult.clientId,
            details:
              machineError instanceof Error
                ? machineError.message
                : String(machineError),
          },
          { status: 500 }
        );
      }
    }

let settlementSyncResult:
  Awaited<
    ReturnType<
      typeof syncMaintenanceSettlement
    >
  > | null = null;

let settlementSyncError:
  string | null = null;

try {
  settlementSyncResult =
    await syncMaintenanceSettlement({
      taskId: Number(taskId),
      taskType: type,
      clientName: name,
      machines,
      machineDetails:
        finalMachineDetails,
      completedAt,
    });

  console.log(
    "Szerkesztett munka karbantartási elszámolása:",
    settlementSyncResult
  );
} catch (settlementError) {
  settlementSyncError =
    settlementError instanceof Error
      ? settlementError.message
      : String(settlementError);

  console.error(
    "A szerkesztett munka elszámolása nem sikerült:",
    settlementError
  );
}
    
    let emailSent = false;

    if (notificationEmails.length > 0) {
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
  type === "telepites"
    ? "🛠️ Telepítés"
    : "🧹 Karbantartás";

const machinesEmailHtml =
  machines.length > 0
    ? machines
        .map(
          (
            machine,
            index
          ) => {
            const detail:
              MachineDetail =
                finalMachineDetails[
                  index
                ] || {
                  maintenanceType:
                    "",
                  warranty: null,
                };

            const maintenanceRow =
              type ===
              "karbantartas"
                ? `
                  <div
                    style="
                      margin-top: 5px;
                    "
                  >
                    <strong>
                      Karbantartás:
                    </strong>
                    ${getMaintenanceTypeLabel(
                      detail.maintenanceType
                    )}
                  </div>
                `
                : "";

            return `
              <div
                style="
                  margin-top: 8px;
                  padding: 10px;
                  background: #f3f4f6;
                  border: 1px solid #e5e7eb;
                  border-radius: 6px;
                "
              >
                <div>
                  <strong>
                    Gép #${index + 1}:
                  </strong>
                  ${machine}
                </div>

                ${maintenanceRow}

                <div
                  style="
                    margin-top: 5px;
                  "
                >
                  <strong>
                    Garanciális:
                  </strong>
                  ${getWarrantyLabel(
                    detail.warranty
                  )}
                </div>
              </div>
            `;
          }
        )
        .join("")
    : `
      <div>
        Nincs megadott gép.
      </div>
    `;

        await transporter.sendMail({
          from: `"Klíma Rendszer" <${process.env.EMAIL_USER}>`,
          to: notificationEmails,
          subject: `✏️ Munka módosítva: ${typeLabel} (${name || "Névtelen"})`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
              <div style="background-color:#f39c12;color:white;padding:20px;text-align:center;">
                <h2 style="margin:0;">Egy munka adatai frissültek</h2>
                <p style="margin:6px 0 0;">${typeLabel}</p>
              </div>
              <div style="padding:20px;color:#333;">
                <p><strong>Munkaazonosító:</strong> #${taskId}</p>
                <p><strong>Név:</strong> ${name || "-"}</p>
                <p><strong>Cím:</strong> ${address || "-"}</p>
                <p><strong>Telefon:</strong> ${phone || "-"}</p>
                <p><strong>Email:</strong> ${email || "-"}</p>
                <p><strong>Tervezett időpont:</strong> ${scheduledAt || "-"}</p>
                <p><strong>Megvalósult időpont:</strong> ${completedAt || "-"}</p>
              <div
  style="
    margin-bottom: 14px;
  "
>
  <strong>
    Gépek:
  </strong>

  <div
    style="
      margin-top: 6px;
    "
  >
    ${machinesEmailHtml}
  </div>
</div>

<p>
  <strong>
    Fizetési mód:
  </strong>
  ${getPaymentMethodLabel(
    finalPaymentMethod
  )}
</p>
                <p><strong>Megjegyzés:</strong> ${note || "-"}</p>
              </div>
              <div style="background-color:#f8f9fa;padding:15px;text-align:center;font-size:12px;color:#7f8c8d;">
                Automata üzenet az NS-AIR Rendszerből.
              </div>
            </div>
          `,
        });

        emailSent = true;
      } catch (mailError) {
        console.error("Email küldési hiba módosításkor:", mailError);
      }
    }

    let message = "Munka sikeresen módosítva.";

    if (clientSyncResult?.created) {
      message += " Az ügyfél automatikusan bekerült az ügyfelek közé.";
    } else if (clientSyncResult?.reason === "missing-name") {
      message += " Ügyfél nem készült, mert nincs megadva név.";
    } else {
      message += " Az ügyfél már szerepel az ügyfelek között.";
    }

if (
  machineSyncResult
    .createdMachines.length > 0
) {
  message +=
    ` ${machineSyncResult.createdMachines.length} gép hozzáadva az ügyfélhez.`;
}

if (
  settlementSyncResult
    ?.createdItems.length
) {
  message +=
    ` ${settlementSyncResult.createdItems.length} karbantartási tétel bekerült az elszámolásba.`;
}

if (
  settlementSyncResult
    ?.alreadyExistingItems.length
) {
  message +=
    ` ${settlementSyncResult.alreadyExistingItems.length} karbantartási tétel már korábban szerepelt az elszámolásban.`;
}

if (
  settlementSyncResult
    ?.skippedItems.length
) {
  message +=
    ` ${settlementSyncResult.skippedItems.length} gép elszámolása kimaradt.`;
}

if (
  settlementSyncResult?.skipped &&
  settlementSyncResult.skipReason
) {
  message +=
    ` Elszámolás nem készült: ${settlementSyncResult.skipReason}`;
}

if (settlementSyncError) {
  message +=
    ` A munka módosult, de az elszámolás nem sikerült: ${settlementSyncError}`;
}

if (emailSent) {
  message +=
    " Az értesítő email elküldve.";
}

return NextResponse.json({
  message,

  taskId,

  images: finalImages,

  machines,

  machineDetails:
    finalMachineDetails,

  paymentMethod:
    finalPaymentMethod,

  machinesAddedToClient:
    machineSyncResult
      .createdMachines,

  machinesAlreadyExisted:
    machineSyncResult
      .existingMachines,

  clientCreated:
    clientSyncResult?.created ||
    false,

  clientId:
    clientSyncResult?.clientId ||
    null,

  clientMatchReason:
    clientSyncResult?.reason ||
    null,

  settlement: {
    createdItems:
      settlementSyncResult
        ?.createdItems || [],

    alreadyExistingItems:
      settlementSyncResult
        ?.alreadyExistingItems || [],

    skippedItems:
      settlementSyncResult
        ?.skippedItems || [],

    skipped:
      settlementSyncResult
        ?.skipped || false,

    skipReason:
      settlementSyncResult
        ?.skipReason || null,

    error:
      settlementSyncError,
  },

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
