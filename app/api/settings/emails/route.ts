import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await prisma.emailSetting.findMany();
    const emails = settings.map((s) => s.email);

    // Ha az adatbázis üres, visszatérhetünk a .env-ben lévőkkel (opcionális betöltés)
    if (emails.length === 0 && process.env.RECIPIENT_EMAILS) {
      const envEmails = process.env.RECIPIENT_EMAILS.split(",")
        .map((e) => e.trim())
        .filter((e) => e.length > 0);
      
      // Opcionálisan betölthetjük őket az adatbázisba is az első alkalommal
      for (const email of envEmails) {
        await prisma.emailSetting.upsert({
          where: { email },
          update: {},
          create: { email },
        });
      }
      return NextResponse.json({ emails: envEmails }, { status: 200 });
    }

    return NextResponse.json({ emails }, { status: 200 });
  } catch (error: any) {
    console.error("Hiba az email címek lekérdezésekor:", error);
    return NextResponse.json(
      { error: "Nem sikerült betölteni az email címeket." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { email, action } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email cím megadása kötelező!" }, { status: 400 });
    }

    const trimmedEmail = email.trim();

    if (action === "add") {
      await prisma.emailSetting.upsert({
        where: { email: trimmedEmail },
        update: {},
        create: { email: trimmedEmail },
      });
    } else if (action === "delete") {
      await prisma.emailSetting.deleteMany({
        where: { email: trimmedEmail },
      });
    }

    // Lekérjük a friss listát
    const settings = await prisma.emailSetting.findMany();
    const emails = settings.map((s) => s.email);

    return NextResponse.json({ success: true, emails }, { status: 200 });
  } catch (error: any) {
    console.error("Hiba a mentés során:", error);
    return NextResponse.json(
      { error: `Hiba történt a mentés során: ${error.message || error}` },
      { status: 500 }
    );
  }
}
