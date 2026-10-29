import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

const sql = neon(
  process.env.POSTGRES_URL || ""
);

type MachineDetail = {
  maintenanceType:
    | "mosas"
    | "fertotlenites"
    | "";
  warranty: boolean | null;
  invoiced: boolean;
};

export async function GET() {
  try {
    const rawTasks = await sql`
      SELECT *
      FROM "Task"
      ORDER BY "id" DESC
    `;

    const tasks = rawTasks.map(
      (task: any) => {
        let imagesArray:
          string[] = [];

        let machinesArray:
          string[] = [];

        if (
          Array.isArray(
            task.machines
          )
        ) {
          machinesArray =
            task.machines
              .map(
                (
                  machine: unknown
                ) =>
                  typeof machine ===
                  "string"
                    ? machine.trim()
                    : ""
              )
              .filter(Boolean);
        } else if (
          typeof task.machines ===
            "string" &&
          task.machines.trim() !== ""
        ) {
          try {
            const parsedMachines =
              JSON.parse(
                task.machines
              );

            machinesArray =
              Array.isArray(
                parsedMachines
              )
                ? parsedMachines
                    .map(
                      (
                        machine: unknown
                      ) =>
                        typeof machine ===
                        "string"
                          ? machine.trim()
                          : ""
                    )
                    .filter(Boolean)
                : [];
          } catch (error) {
            console.error(
              `A(z) ${task.id}. munka géplistája nem dolgozható fel:`,
              error
            );

            machinesArray = [];
          }
        }

        let machineDetailsArray:
          MachineDetail[] = [];

        if (
          Array.isArray(
            task.machineDetails
          )
        ) {
          machineDetailsArray =
            task.machineDetails.map(
              (
                detail: any
              ): MachineDetail => {
                const maintenanceType:
                  MachineDetail["maintenanceType"] =
                    detail
                      ?.maintenanceType ===
                      "mosas" ||
                    detail
                      ?.maintenanceType ===
                      "fertotlenites"
                      ? detail
                          .maintenanceType
                      : "";

                const warranty:
                  boolean | null =
                    detail?.warranty ===
                    true
                      ? true
                      : detail
                            ?.warranty ===
                          false
                        ? false
                        : null;

                const invoiced =
                  detail?.invoiced === true
                    ? true
                    : false;

                return {
                  maintenanceType,
                  warranty,
                  invoiced,
                };
              }
            );
        } else if (
          typeof task.machineDetails ===
            "string" &&
          task.machineDetails
            .trim() !== ""
        ) {
          try {
            const parsedMachineDetails =
              JSON.parse(
                task.machineDetails
              );

            if (
              Array.isArray(
                parsedMachineDetails
              )
            ) {
              machineDetailsArray =
                parsedMachineDetails.map(
                  (
                    detail: any
                  ): MachineDetail => {
                    const maintenanceType:
                      MachineDetail["maintenanceType"] =
                        detail
                          ?.maintenanceType ===
                          "mosas" ||
                        detail
                          ?.maintenanceType ===
                          "fertotlenites"
                          ? detail
                              .maintenanceType
                          : "";

                    const warranty:
                      boolean | null =
                        detail
                          ?.warranty ===
                        true
                          ? true
                          : detail
                                ?.warranty ===
                              false
                            ? false
                            : null;

                    const invoiced =
                      detail?.invoiced === true
                        ? true
                        : false;

                    return {
                      maintenanceType,
                      warranty,
                      invoiced,
                    };
                  }
                );
            }
          } catch (error) {
            console.error(
              `A(z) ${task.id}. munka gépadatai nem dolgozhatók fel:`,
              error
            );

            machineDetailsArray = [];
          }
        }

        machineDetailsArray =
          machinesArray.map(
            (
              _,
              index
            ): MachineDetail => {
              const detail =
                machineDetailsArray[
                  index
                ];

              if (!detail) {
                return {
                  maintenanceType:
                    "",
                  warranty: null,
                  invoiced: false,
                };
              }

              return {
                maintenanceType:
                  task.type ===
                  "karbantartas"
                    ? detail
                        .maintenanceType
                    : "",

                warranty:
                  detail.warranty,

                invoiced:
                  detail.invoiced === true,
              };
            }
          );

        const paymentMethod:
          | "keszpenz"
          | "atutalas"
          | null =
            task.paymentMethod ===
              "keszpenz" ||
            task.paymentMethod ===
              "atutalas"
              ? task.paymentMethod
              : null;

        if (
          Array.isArray(task.images)
        ) {
          imagesArray =
            task.images;
        } else if (
          typeof task.images ===
            "string" &&
          task.images
            .trim()
            .startsWith("[")
        ) {
          try {
            const parsedImages =
              JSON.parse(
                task.images
              );

            imagesArray =
              Array.isArray(
                parsedImages
              )
                ? parsedImages
                : [];
          } catch {
            imagesArray = [];
          }
        } else if (
          typeof task.images ===
            "string" &&
          task.images.trim() !== ""
        ) {
          imagesArray = [
            task.images,
          ];
        }

        let description =
          task.description || "";

        let extractedEmail = "";

        if (
          description.includes(
            "| Email:"
          )
        ) {
          const parts =
            description.split(
              "| Email:"
            );

          description =
            parts[0]?.trim() || "";

          extractedEmail =
            parts
              .slice(1)
              .join("| Email:")
              .trim();
        } else if (
          description.startsWith(
            "Email:"
          )
        ) {
          extractedEmail =
            description
              .replace(
                "Email:",
                ""
              )
              .trim();

          description = "";
        }

        const latitudeValue =
          task.latitude === null ||
          task.latitude ===
            undefined ||
          task.latitude === ""
            ? null
            : Number(
                task.latitude
              );

        const longitudeValue =
          task.longitude === null ||
          task.longitude ===
            undefined ||
          task.longitude === ""
            ? null
            : Number(
                task.longitude
              );

        const latitude =
          latitudeValue !== null &&
          Number.isFinite(
            latitudeValue
          )
            ? latitudeValue
            : null;

        const longitude =
          longitudeValue !== null &&
          Number.isFinite(
            longitudeValue
          )
            ? longitudeValue
            : null;

        return {
          id: Number(task.id),

          type:
            task.type ||
            "telepites",

          name:
            task.clientName ||
            task.title ||
            "",

          address:
            task.address || "",

          phone:
            task.phone || "",

          email:
            task.email ||
            extractedEmail ||
            "",

          note: description,

          scheduled_at:
            task.scheduled_at ||
            task.scheduledAt ||
            "",

          completed_at:
            task.completed_at ||
            task.completedAt ||
            "",

          images:
            imagesArray,

          machines:
            machinesArray,

          machineDetails:
            machineDetailsArray,

          paymentMethod,

          created_at:
            task.createdAt ||
            task.created_at ||
            task.date ||
            task.updatedAt ||
            "",

          recipient_emails:
            task.recipient_emails ||
            "",

          latitude,

          longitude,
        };
      }
    );

    return NextResponse.json(
      {
        tasks,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error(
      "Feladatok lekérdezési hibája:",
      error
    );

    return NextResponse.json(
      {
        tasks: [],
        error:
          error?.message ||
          "Lekérdezési hiba",
      },
      {
        status: 500,
      }
    );
  }
}
