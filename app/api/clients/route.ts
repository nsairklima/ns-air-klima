import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const newClient = await prisma.client.create({
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        notes: data.notes,
      },
    });
    return NextResponse.json(newClient);
  } catch (error) {
    return NextResponse.json({ error: "Sikertelen mentés" }, { status: 500 });
  }
}

export async function GET() {
  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" }
  });
  return NextResponse.json(clients);
}

// Opcionális: Ha véletlenül GET-et is hívnál erre az útra
export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(clients);
  } catch (error) {
    return new NextResponse("Hiba a lekéréskor", { status: 500 });
  }
}
