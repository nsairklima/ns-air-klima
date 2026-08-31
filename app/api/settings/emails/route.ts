import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const envPath = path.resolve(process.cwd(), ".env");

function getEnvEmailsArray(): string[] {
  try {
    const envEmails = process.env.RECIPIENT_EMAILS || "";
    return envEmails
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e.length > 0);
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const emails = getEnvEmailsArray();
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

    let currentEmails = getEnvEmailsArray();

    if (action === "add") {
      const trimmedEmail = email.trim();
      if (!currentEmails.includes(trimmedEmail)) {
        currentEmails.push(trimmedEmail);
      }
    } else if (action === "delete") {
      currentEmails = currentEmails.filter((e) => e !== email);
    }

    const newEnvValue = `RECIPIENT_EMAILS="${currentEmails.join(",")}"`;

    let envFileContent = "";
    if (fs.existsSync(envPath)) {
      envFileContent = fs.readFileSync(envPath, "utf8");
    }

    if (envFileContent.includes("RECIPIENT_EMAILS=")) {
      const lines = envFileContent.split("\n");
      const updatedLines = lines.map((line) => {
        if (line.startsWith("RECIPIENT_EMAILS=")) {
          return newEnvValue;
        }
        return line;
      });
      envFileContent = updatedLines.join("\n");
    } else {
      envFileContent += `\n${newEnvValue}\n`;
    }

    fs.writeFileSync(envPath, envFileContent, "utf8");
    process.env.RECIPIENT_EMAILS = currentEmails.join(",");

    return NextResponse.json({ success: true, emails: currentEmails }, { status: 200 });
  } catch (error: any) {
    console.error("Hiba az .env mentésekor:", error);
    return NextResponse.json({ error: "Hiba történt a mentés során." }, { status: 500 });
  }
}
