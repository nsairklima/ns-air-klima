import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.POSTGRES_URL || "");

export async function GET() {
  try {
    const tasks = await sql`
      SELECT *
      FROM tasks
      ORDER BY id DESC
    `;

    return NextResponse.json({
      tasks,
    });
  } catch (error) {
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
