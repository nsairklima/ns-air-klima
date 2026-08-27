import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

const sql = neon(process.env.POSTGRES_URL || "");

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await sql`DELETE FROM "Task" WHERE id = ${params.id}`;
    return NextResponse.json({ message: "Sikeres törlés" });
  } catch (error) {
    console.error("Törlési hiba:", error);
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

    // Frissítjük a valós oszlopokat az adatbázisban
    await sql`
      UPDATE "Task"
      SET type = ${type || "telepites"},
          title = ${name || "Módosított munka"},
          clientName = ${name || ""},
          address = ${address || ""},
          phone = ${phone || ""},
          description = ${note ? `${note} ${email ? `| Email: ${email}` : ""}` : email ? `Email: ${email}` : ""},
          updatedAt = NOW()
      WHERE id = ${params.id}
    `;

    return NextResponse.json({ message: "Sikeres frissítés" });
  } catch (error) {
    console.error("Szerkesztési hiba:", error);
    return NextResponse.json({ error: "Szerkesztési hiba" }, { status: 500 });
  }
}
