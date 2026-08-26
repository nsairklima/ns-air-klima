import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

const sql = neon(process.env.POSTGRES_URL || "");

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Javítva: "Task" (nagybetűvel és idézőjelek között)
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

    // Javítva: "Task" (nagybetűvel és idézőjelek között)
    // Megjegyzés: Ha az adatbázisban a oszlopnevek is nagybetűvel vagy specifikusan vannak, 
    // azokat is igazítani kell, de a tábla neve "Task" lesz a kulcs.
    await sql`
      UPDATE "Task"
      SET type = ${type},
          "clientName" = ${name || ""},
          address = ${address || ""},
          phone = ${phone || ""}
      WHERE id = ${params.id}
    `;

    return NextResponse.json({ message: "Sikeres frissítés" });
  } catch (error) {
    console.error("Szerkesztési hiba:", error);
    return NextResponse.json({ error: "Szerkesztési hiba" }, { status: 500 });
  }
}
