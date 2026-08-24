import { NextResponse } from "next/server";

// Ha PostgreSQL / Prisma / Supabase / Vercel KV-t használsz, itt tudod frissíteni az adatbázist.
// Ez a minta az adatbázis frissítésének helyét mutatja be:

export async function GET() {
  try {
    // ITT TÖLTÖD BET AZ ADATOKAT AZ ADATBÁZISBÓL
    // pl.: const tasks = await prisma.task.findMany();
    return NextResponse.json([]); 
  } catch (error) {
    return NextResponse.json({ error: "Hiba az adatok lekérésekor" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, clientName, phone, address, date, status, description } = body;

    if (!id) {
      return NextResponse.json({ error: "Hiányzó azonosító (id)" }, { status: 400 });
    }

    // ITT FRISSÍTED AZ ADATBÁZIST AZ ÚJ ADATOKKAL:
    // Például Prisma esetén:
    // await prisma.task.update({
    //   where: { id: Number(id) },
    //   data: { title, clientName, phone, address, date, status, description }
    // });

    console.log("Sikeresen frissített adat:", body);

    return NextResponse.json({ success: true, message: "Sikeres mentés!" }, { status: 200 });
  } catch (error) {
    console.error("PUT Hiba:", error);
    return NextResponse.json({ error: "Szerver oldali hiba a mentés során" }, { status: 500 });
  }
}

// Biztonsági opció: ha a szervered a POST kérést preferálná a PUT helyett
export async function POST(request: Request) {
  return PUT(request);
}
