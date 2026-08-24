import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // vagy az általad használt adatbázis-kliens

// Munkák lekérése
export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(tasks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Új munka mentése
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newTask = await prisma.task.create({
      data: {
        type: body.type,
        title: body.title,
        clientName: body.clientName,
        phone: body.phone,
        address: body.address,
        assignedTo: body.assignedTo,
        date: body.date,
        description: body.description,
        status: body.status || "pending",
        images: JSON.stringify(body.images || []),
      },
    });
    return NextResponse.json(newTask);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
