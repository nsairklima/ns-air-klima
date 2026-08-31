import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const dataFilePath = path.resolve(process.cwd(), "emails.json");

// Emailek betöltése a JSON fájlból (vagy visszalépés a .env-re, ha még nincs JSON)
function getStoredEmails(): string[] {
  try {
    if (fs.existsSync(dataFilePath)) {
      const fileData = fs.readFileSync(dataFilePath, "utf8");
      const parsed = JSON.parse(fileData);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error("Hiba az emails.json olvasásakor:", err);
  }

  // Fallback: Ha nincs még JSON, az .env-ből olvessuk ki egyszer
  const envEmails = process.env.RECIPIENT_EMAILS || "";
  return envEmails
    .split(",")
    .map((e) => e.trim())
    .filter((e) => e.length > 0);
}

export async function GET() {
  try {
    const emails = getStoredEmails();
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

    let currentEmails = getStoredEmails();

    if (action === "add") {
      const trimmedEmail = email.trim();
      if (!currentEmails.includes(trimmedEmail)) {
        currentEmails.push(trimmedEmail);
      }
    } else if (action === "delete") {
      currentEmails = currentEmails.filter((e) => e !== email);
    }

    // Mentés JSON fájlba (ez írható marad a legtöbb környezetben, vagy ha Vercel, akkor külső adatbázis/KV kellene, de lokális/VPS szerveren ez tökéletes)
    fs.writeFileSync(dataFilePath, JSON.stringify(currentEmails, null, 2), "utf8");
    
    // Frissítjük a futásidejű környezeti változót is
    process.env.RECIPIENT_EMAILS = currentEmails.join(",");

    return NextResponse.json({ success: true, emails: currentEmails }, { status: 200 });
  } catch (error: any) {
    console.error("Hiba a mentés során:", error);
    return NextResponse.json({ error: `Hiba történt a mentés során: ${error.message || error}` }, { status: 500 });
  }
}
