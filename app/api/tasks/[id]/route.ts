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
    const body = await request.json().catch(() => ({}));

    const type = body.type || "installation";
    const name = body.name || body.clientName || body.client_name || "";
    const address = body.address || body.location || "";
    const phone = body.phone || body.telephone || "";
    const email = body.email || body.clientEmail || "";
    const note = body.note || body.notes || body.description || "";

    let descriptionText = note;
    if (email) {
      descriptionText = descriptionText ? `${descriptionText} | Email: ${email}` : `Email: ${email}`;
    }

    await sql`
      UPDATE "Task"
      SET type = ${type},
          "clientName" = ${name},
          title = ${name || "Munkalap"},
          address = ${address},
          phone = ${phone},
          description = ${descriptionText},
          "updatedAt" = NOW()
      WHERE id = ${params.id}
    `;

    return NextResponse.json({ message: "Sikeres frissítés" });
  } catch (error) {
    console.error("Szerkesztési hiba:", error);
    return NextResponse.json({ error: "Szerkesztési hiba" }, { status: 500 });
  }
}
