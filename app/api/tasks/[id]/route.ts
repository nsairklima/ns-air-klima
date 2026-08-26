import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

const sql = neon(process.env.POSTGRES_URL || "");

// Munkák törlése (DELETE kérés)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;

    await sql`
      DELETE FROM tasks
      WHERE id = ${taskId}
    `;

    return NextResponse.json({ message: "Sikeres törlés" });
  } catch (error) {
    console.error("Törlési hiba:", error);
    return NextResponse.json(
      { error: "Nem sikerült törölni a munkát." },
      { status: 500 }
    );
  }
}

// Munka adatinak frissítése (PUT kérés)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;
    const body = await request.json();
    const { type, address } = body;

    await sql`
      UPDATE tasks
      SET type = ${type}, address = ${address}
      WHERE id = ${taskId}
    `;

    return NextResponse.json({ message: "Sikeres frissítés" });
  } catch (error) {
    console.error("Szerkesztési hiba:", error);
    return NextResponse.json(
      { error: "Nem sikerült frissíteni a munkát." },
      { status: 500 }
    );
  }
}
