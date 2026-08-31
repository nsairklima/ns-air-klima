import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const envEmails = process.env.RECIPIENT_EMAILS || "";
    
    const emails = envEmails
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    return NextResponse.json({ emails }, { status: 200 });
  } catch (error: any) {
    console.error("Hiba az email címek lekérdezésekor:", error);
    return NextResponse.json(
      { error: "Nem sikerült betölteni az email címeket." },
      { status: 500 }
    );
  }
}
