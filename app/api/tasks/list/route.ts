import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

const sql = neon(process.env.POSTGRES_URL || "");

export async function GET() {
  try {
    const rawTasks = await sql`
      SELECT *
      FROM "Task"
      ORDER BY id DESC
    `;

    const tasks = rawTasks.map((t: any) => {
      let imagesArray: string[] = [];
      if (Array.isArray(t.images)) {
        imagesArray = t.images;
      } else if (typeof t.images === "string" && t.images.startsWith("[")) {
        try {
          imagesArray = JSON.parse(t.images);
        } catch {}
      } else if (typeof t.images === "string" && t.images.trim() !== "") {
        imagesArray = [t.images];
      }

      let description = t.description || "";
      let extractedEmail = "";

      if (description.includes("| Email:")) {
        const parts = description.split("| Email:");
        description = parts[0].trim();
        extractedEmail = parts[1].trim();
      } else if (description.startsWith("Email:")) {
        extractedEmail = description.replace("Email:", "").trim();
        description = "";
      }

      return {
        id: t.id,
        type: t.type || "telepites",
        name: t.clientName || t.title || "",
        address: t.address || "",
        phone: t.phone || "",
        email: t.email || extractedEmail,
        note: description,
        scheduled_at: t.scheduled_at || t.scheduledAt || "",
        completed_at: t.completed_at || t.completedAt || "",
        images: imagesArray,
        created_at: t.date || t.updatedAt || "",
      };
    });

    return NextResponse.json({
      tasks,
    });
  } catch (error) {
    console.error("Lekérdezési hiba:", error);
    return NextResponse.json(
      { error: "Lekérdezési hiba" },
      { status: 500 }
    );
  }
}
