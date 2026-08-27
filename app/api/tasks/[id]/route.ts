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
  } catch (error: any) {
    console.error("Törlési hiba:", error);
    return NextResponse.json({ error: error?.message || "Törlési hiba" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { type, name, address, phone, email, note } = body;

    const taskType = type || "telepites";
    const taskTitle = name || "Módosított munka";
    const clientName = name || "";
    const taskAddress = address || "";
    const taskPhone = phone || "";
    
    // Összeállítjuk a description mezőt a note és email alapján, pontosan úgy, mint a POST-nál
    const description = note ? `${note}${email ? ` | Email: ${email}` : ""}` : email ? `Email: ${email}` : "";

    await sql`
      UPDATE "Task"
      SET "type" = ${taskType},
          "title" = ${taskTitle},
          "clientName" = ${clientName},
          "address" = ${taskAddress},
          "phone" = ${taskPhone},
          "description" = ${description},
          "updatedAt" = NOW()
      WHERE "id" = ${params.id}
    `;

    return NextResponse.json({ message: "Sikeres frissítés" });
  } catch (error: any) {
    console.error("Szerkesztési hiba részletei:", error);
    return NextResponse.json({ error: error?.message || "Szerkesztési hiba" }, { status: 500 });
  }
}
