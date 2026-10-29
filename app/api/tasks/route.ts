



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

type MachineDetail = {
  maintenanceType:
    | "mosas"
    | "fertotlenites"
    | "";
  warranty: boolean | null;
  invoiced: boolean; 
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

  await prisma.client.update({
    where: {
      id: emailMatch.id,
    },
    data: {
      address:
        address || emailMatch.address,
      phone:
        phone || emailMatch.phone,
      email:
        emailMatch.email || cleanEmail,
    },
  });

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

  await prisma.client.update({
    where: {
      id: phoneMatch.id,
    },
    data: {
      address:
        cleanAddress || phoneMatch.address,

      phone:
        phoneMatch.phone || cleanPhone,

      email:
        phoneMatch.email || cleanEmail || null,
    },
  });

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

  await prisma.client.update({
    where: {
      id: nameAddressMatch.id,
    },
    data: {
      phone:
        phone || nameAddressMatch.phone,
      email:
        cleanEmail ||
        nameAddressMatch.email,
    },
  });

  return {
    created: false,
    reason: "existing-name-address",
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

  await prisma.client.update({
    where: {
      id: nameMatch.id,
    },
    data: {
      address:
        cleanAddress ||
        nameMatch.address,

      phone:
        cleanPhone ||
        nameMatch.phone,

      email:
        cleanEmail ||
        nameMatch.email,
    },
  });

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

  for (const machineName of cleanMachines) {
    const parts = machineName.split(/\s+/);

    const brand =
      parts.length > 1
        ? parts[0]
        : "Ismeretlen";

    const model =
      parts.length > 1
        ? parts.slice(1).join(" ")
        : machineName;

    const existingUnit =
      await prisma.clientUnit.findFirst({
        where: {
          clientId,
          brand: {
            equals: brand,
            mode: "insensitive",
          },
          model: {
            equals: model,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
        },
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
        status: completedAt
          ? "INSTALLED"
          : "PENDING",
        installation: scheduledAt
          ? new Date(scheduledAt.replace(" ", "T"))
          : null,
        installedAt: completedAt
          ? new Date(completedAt.replace(" ", "T"))
          : null,
        periodMonths: 12,
        notes:
          "Automatikusan létrehozva munkafelvételkor.",
      },
    });

    createdMachines.push(machineName);
  }

  return {
    createdMachines,
    existingMachines,
  };
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

export async function POST(
  request: Request
) {
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
    
const machinesRaw =
  cleanText(formData.get("machines"));

let machines: string[] = [];

if (machinesRaw) {
  try {
    const parsedMachines =
      JSON.parse(machinesRaw);

    if (Array.isArray(parsedMachines)) {
      machines = parsedMachines
        .map((machine) =>
          cleanText(machine)
        )
        .filter(Boolean);
    }
  } catch (error) {
    console.error(
      "A géptípusok feldolgozása sikertelen:",
      error
    );
  }
}

    const machineDetailsRaw =
  cleanText(
    formData.get("machineDetails")
  );

let machineDetails:
  MachineDetail[] = [];

if (machineDetailsRaw) {
  try {
    const parsedMachineDetails =
      JSON.parse(machineDetailsRaw);

    if (
      Array.isArray(
        parsedMachineDetails
      )
    ) {
      machineDetails =
        parsedMachineDetails.map(
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

            if (
              detail?.warranty === true
            ) {
              warranty = true;
            } else if (
              detail?.warranty === false
            ) {
              warranty = false;
            }

       let invoiced = false;
        if (detail?.invoiced === true) {
          invoiced = true;
        }

        return {
          maintenanceType:
            taskType === "karbantartas"
              ? maintenanceType
              : "",

          warranty,
          invoiced, // <-- EZT IS ADD HOZZÁ
        };
          }
        );
    }
  } catch (error) {
    console.error(
      "A gépek kiegészítő adatainak feldolgozása sikertelen:",
      error
    );
  }
}

/*
 * Minden géphez pontosan egy
 * kiegészítő adatsor tartozzon.
 */
machineDetails = machines.map(
  (_, index) => {
    return (
      machineDetails[index] || {
        maintenanceType: "",
        warranty: null,
      }
    );
  }
);

const paymentMethodRaw =
  cleanText(
    formData.get("paymentMethod")
  );

const paymentMethod:
  "keszpenz" |
  "atutalas" |
  null =
    paymentMethodRaw === "keszpenz" ||
    paymentMethodRaw === "atutalas"
      ? paymentMethodRaw
      : null;

    const latitude =
      parseCoordinate(
        formData.get("latitude")
      );

    const longitude =
      parseCoordinate(
        formData.get("longitude")
      );

    console.log(
      "Frontendről érkező koordináták:",
      {
        address,
        latitude,
        longitude,
      }
    );

    const recipientsRaw =
      cleanText(
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

    const scheduledAtRaw =
      cleanText(
        formData.get("scheduledAt")
      );

    const completedAtRaw =
      cleanText(
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

    console.log(
      "POST időpontok:",
      {
        scheduledAtRaw,
        scheduledAt,
        completedAtRaw,
        completedAt,
      }
    );

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

    const insertedTasks =
  await sql`
    INSERT INTO "Task" (
      "type",
      "title",
      "clientName",
      "address",
      "phone",
      "date",
      "description",
      "images",
      "machines",
      "machineDetails",
      "paymentMethod",
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
      ${JSON.stringify(machines)},
      ${JSON.stringify(
        machineDetails
      )},
      ${paymentMethod},
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

    const newTaskId =
      insertedTasks[0]?.id;

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

let machineSyncResult = {
  createdMachines: [] as string[],
  existingMachines: [] as string[],
};

if (
  clientSyncResult.clientId &&
  machines.length > 0
) {
  try {
    machineSyncResult =
      await syncMachinesToClient({
        clientId:
          clientSyncResult.clientId,
        machines,
        scheduledAt,
        completedAt,
      });

    console.log(
      "Ügyfélhez rendelt gépek:",
      machineSyncResult
    );
  } catch (machineError) {
    console.error(
      "A gépek ügyfélhez rendelése sikertelen:",
      machineError
    );

    return NextResponse.json(
      {
        error:
          "A munka létrejött, de a gépeket nem sikerült az ügyfélhez rendelni.",
        taskId: newTaskId,
        clientId:
          clientSyncResult.clientId,
        details:
          machineError instanceof Error
            ? machineError.message
            : String(machineError),
      },
      {
        status: 500,
      }
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

    if (
  newTaskId !== null &&
  newTaskId !== undefined
) {
  try {
    settlementSyncResult =
      await syncMaintenanceSettlement({
        taskId: Number(newTaskId),
        taskType: type,
        clientName: name,
        machines,
       machineDetails,
paymentMethod,
completedAt,
      });

    console.log(
      "Új munka karbantartási elszámolása:",
      settlementSyncResult
    );
  } catch (settlementError) {
    settlementSyncError =
      settlementError instanceof Error
        ? settlementError.message
        : String(settlementError);

    console.error(
      "Az új munka elszámolása nem sikerült:",
      settlementError
    );
  }
}
    
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
              rejectUnauthorized: false,
            },
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
                machineDetails[
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

                <p
                  style="
                    margin: 6px 0 0;
                  "
                >
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
                  <strong>
                    Tervezett időpont:
                  </strong>
                  ${scheduledAt || "-"}
                </p>

                <p>
                  <strong>
                    Megvalósult időpont:
                  </strong>
                  ${completedAt || "-"}
                </p>

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
    paymentMethod
  )}
</p>


                <p>
                  <strong>
                    Megjegyzés:
                  </strong>
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
    ` ${settlementSyncResult.alreadyExistingItems.length} tétel már korábban szerepelt az elszámolásban.`;
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
    ` A munka létrejött, de az elszámolás nem sikerült: ${settlementSyncError}`;
}
    
    if (emailSent) {
      message +=
        " Az értesítő email elküldve.";
    }

 return NextResponse.json({
  message,

  taskId: newTaskId,

  machines,

  machineDetails,

  paymentMethod,

  machinesAddedToClient:
    machineSyncResult.createdMachines,

  machinesAlreadyExisted:
    machineSyncResult.existingMachines,

  clientCreated:
    clientSyncResult.created,

  clientId:
    clientSyncResult.clientId ||
    null,

  clientMatchReason:
    clientSyncResult.reason,

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

  latitude,

  longitude,

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
