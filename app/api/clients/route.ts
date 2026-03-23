import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("search");

    const clients = await prisma.client.findMany({
      where: query ? {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ]
      } : {},
      orderBy: { name: "asc" },
    });

    return NextResponse.json(clients);
  } catch (error) {
    return NextResponse.json({ error: "Hiba a kereséskor" }, { status: 500 });
  }
}
