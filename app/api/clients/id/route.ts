import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/clients/[clientId] – Egy ügyfél adatai
export async function GET(
  _req: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const id = Number(params.clientId);
    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) {
      return NextResponse.json(
        { error: "Ügyfél nem található." },
        { status: 404 }
      );
    }
    return NextResponse.json(client);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Ismeretlen hiba." },
      { status: 500 }
    );
  }
}

// PATCH /api/clients/[clientId] – Ügyfél frissítése (név, email, telefon, cím)
export async function PATCH(
  req: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const id = Number(params.clientId);
    const body = await req.json();

    const name = (body.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "A név kötelező." }, { status: 400 });
    }

    const email = (body.email || "").trim() || null;
    const phone = (body.phone || "").trim() || null;
    const address = (body.address || "").trim() || null;

    const updated = await prisma.client.update({
      where: { id },
      data: { name, email, phone, address },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Nem sikerült frissíteni az ügyfelet." },
      { status: 500 }
    );
  }
}

// (Opcionális) DELETE /api/clients/[clientId]
// export async function DELETE(_req: Request, { params }: { params: { clientId: string } }) {
//   const id = Number(params.clientId);
//   await prisma.client.delete({ where: { id } });
//   return NextResponse.json({ ok: true });
// }
