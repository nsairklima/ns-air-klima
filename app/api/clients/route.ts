import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// FONTOS: A függvény neve pontosan POST kell legyen, csupa nagybetűvel!
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, address } = body;

    // Ellenőrizzük, hogy legalább név jött-e
    if (!name) {
      return new NextResponse("A név megadása kötelező", { status: 400 });
    }

    // Mentés az adatbázisba
    const newClient = await prisma.client.create({
      data: {
        name: name,
        email: email || "",
        phone: phone || "",
        address: address || "",
      },
    });

    return NextResponse.json(newClient);
  } catch (error: any) {
    console.error("[CLIENTS_POST_ERROR]", error);
    return new NextResponse("Hiba történt a mentés során: " + error.message, { status: 500 });
  }
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
