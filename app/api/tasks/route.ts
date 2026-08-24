import { NextResponse } from "next/server";

// 1. FELADATOK LEKÉRÉSE (GET)
export async function GET() {
  try {
    // ITT TÖLTÖD BET AZ ADATOKAT AZ ADATBÁZISBÓL (pl. Prisma / Supabase)
    // const tasks = await prisma.task.findMany();
    return NextResponse.json([]); 
  } catch (error) {
    return NextResponse.json({ error: "Hiba az adatok lekérésekor" }, { status: 500 });
  }
}

// 2. ÚJ FELADAT LÉTREHOZÁSA (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, clientName, phone, address, date, status, description } = body;

    if (!title) {
      return NextResponse.json({ error: "A megnevezés (title) kötelező!" }, { status: 400 });
    }

    // ITT HOZOD LÉTRE AZ ÚJ REKORDOT AZ ADATBÁZISBAN:
    // const newTask = await prisma.task.create({
    //   data: { title, clientName, phone, address, date, status, description }
    // });

    console.log("Sikeresen létrehozott adat:", body);

    return NextResponse.json({ success: true, message: "Feladat sikeresen létrehozva!" }, { status: 201 });
  } catch (error) {
    console.error("POST Hiba:", error);
    return NextResponse.json({ error: "Szerver oldali hiba a létrehozás során" }, { status: 500 });
  }
}

// 3. MEGLÉVŐ FELADAT MÓDOSÍTÁSA (PUT)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, clientName, phone, address, date, status, description } = body;

    if (!id) {
      return NextResponse.json({ error: "Hiányzó azonosító (id)" }, { status: 400 });
    }

    // ITT FRISSÍTED AZ ADATBÁZIST AZ ÚJ ADATOKKAL:
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
