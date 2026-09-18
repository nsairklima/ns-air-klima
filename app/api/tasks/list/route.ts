



import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

const sql = neon(
  process.env.POSTGRES_URL || ""
);

export async function GET() {
  try {
    const rawTasks = await sql`
      SELECT *
      FROM "Task"
      ORDER BY "id" DESC
    `;

    const tasks = rawTasks.map(
      (task: any) => {
        let imagesArray: string[] = [];

        if (Array.isArray(task.images)) {
          imagesArray = task.images;
        } else if (
          typeof task.images === "string" &&
          task.images.startsWith("[")
        ) {
          try {
            const parsedImages =
              JSON.parse(task.images);

            imagesArray =
              Array.isArray(parsedImages)
                ? parsedImages
                : [];
          } catch {
            imagesArray = [];
          }
        } else if (
          typeof task.images === "string" &&
          task.images.trim() !== ""
        ) {
          imagesArray = [task.images];
        }

        let description =
          task.description || "";

        let extractedEmail = "";

        if (
          description.includes("| Email:")
        ) {
          const parts =
            description.split("| Email:");

          description =
            parts[0]?.trim() || "";

          extractedEmail =
            parts
              .slice(1)
              .join("| Email:")
              .trim();
        } else if (
          description.startsWith("Email:")
        ) {
          extractedEmail =
            description
              .replace("Email:", "")
              .trim();

          description = "";
        }

        const latitudeValue =
          task.latitude === null ||
          task.latitude === undefined ||
          task.latitude === ""
            ? null
            : Number(task.latitude);

        const longitudeValue =
          task.longitude === null ||
          task.longitude === undefined ||
          task.longitude === ""
            ? null
            : Number(task.longitude);

        const latitude =
          latitudeValue !== null &&
          Number.isFinite(latitudeValue)
            ? latitudeValue
            : null;

        const longitude =
          longitudeValue !== null &&
          Number.isFinite(longitudeValue)
            ? longitudeValue
            : null;

        return {
          id: Number(task.id),

          type:
            task.type || "telepites",

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

          images: imagesArray,

          created_at:
            task.createdAt ||
            task.created_at ||
            task.date ||
            task.updatedAt ||
            "",

          recipient_emails:
            task.recipient_emails || "",

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
