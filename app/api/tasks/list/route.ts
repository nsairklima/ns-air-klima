import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

// Kötelezzük a Next.js-t, hogy mindig friss adatot kérjen le az adatbázisból (ne cache-eljen)
export const dynamic = "force-dynamic";

const sql = neon(process.env.POSTGRES_URL || "");

export async function GET() {
  try {
    // Javítva: "Task" (nagybetűvel és idézőjelek között, ahogy a mentésnél is használjuk)
    const tasks = await sql`
      SELECT *
      FROM "Task"
      ORDER BY id DESC
    `;

    return NextResponse.json({
      tasks,
    });
  } catch (error) {
    console.error("Lekérdezési hiba:", error);
    return NextResponse.json(
      {
        error: "Lekérdezési hiba",
      },
      {
        status: 500,
      }
    );
  }
}
