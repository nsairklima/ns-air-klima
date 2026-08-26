import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

const sql = neon(process.env.POSTGRES_URL || "");

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await sql`DELETE FROM tasks WHERE id = ${params.id}`;
    return NextResponse.json({ message: "Sikeres törlés" });
  } catch (error) {
    return NextResponse.json({ error: "Törlési hiba" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { type, name, address, phone, email, note } = body;

    await sql`
      UPDATE tasks
      SET type = ${type},
          name = ${name || ""},
          address = ${address || ""},
          phone = ${phone || ""},
          email = ${email || ""},
          note = ${note || ""}
      WHERE id = ${params.id}
    `;

    return NextResponse.json({ message: "Sikeres frissítés" });
  } catch (error) {
    return NextResponse.json({ error: "Szerkesztési hiba" }, { status: 500 });
  }
}
