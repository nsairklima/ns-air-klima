import { NextResponse } from "next/server";

export async function GET() {
  // Feltételezzük, hogy az .env fájlban így adtad meg őket, pl. vesszővel elválasztva:
  // RECIPIENT_EMAILS=karbantartas@nsairklima.hu,lcsabi9@gmail.com
  const envEmails = process.env.RECIPIENT_EMAILS || "";
  
  const emails = envEmails
    .split(",")
    .map((e) => e.trim())
    .filter((e) => e.length > 0);

  return NextResponse.json({ emails });
}
