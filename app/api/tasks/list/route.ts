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

    // Átnevezzük az adatbázis oszlopait a frontend által elvárt mezővekre,
    // hogy a táblázatban minden a helyén jelenjen meg (név, megjegyzés, kép).
    const tasks = rawTasks.map((t: any) => {
      // Ha a képek tömbben (images) van elem, kivesszük az elsőt a drive_link-hez
      let driveLink = "";
      if (Array.isArray(t.images) && t.images.length > 0) {
        driveLink = t.images[0];
      } else if (typeof t.images === "string" && t.images.startsWith("[")) {
        try {
          const parsed = JSON.parse(t.images);
          if (Array.isArray(parsed) && parsed.length > 0) driveLink = parsed[0];
        } catch {}
      }

      return {
        id: t.id,
        type: t.type || "telepites",
        name: t.clientName || t.title || "",
        address: t.address || "",
        phone: t.phone || "",
        email: "", // Ha külön kell email, kinyerhetjük a descriptionből is, vagy üres
        note: t.description || "",
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
