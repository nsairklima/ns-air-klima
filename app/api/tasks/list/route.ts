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
      let driveLink = "";
      if (Array.isArray(t.images) && t.images.length > 0) {
        driveLink = t.images[0];
      } else if (typeof t.images === "string" && t.images.startsWith("[")) {
        try {
          const parsed = JSON.parse(t.images);
          if (Array.isArray(parsed) && parsed.length > 0) driveLink = parsed[0];
        } catch {}
      }

      // Itt szétválasztjuk a leírást (description), ha tartalmazza a régi formátumú emailt
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
        email: t.email || extractedEmail, // Ha van külön oszlop, azt veszi, különben a leírásból kinyertat
        note: description,
        drive_link: driveLink,
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
