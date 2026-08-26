import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

const sql = neon(process.env.POSTGRES_URL || "");

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const type = (formData.get("type") as string) || "telepites";
    const name = (formData.get("name") as string) || "";
    const address = (formData.get("address") as string) || "";
    const phone = (formData.get("phone") as string) || "";
    const email = (formData.get("email") as string) || "";
    const note = (formData.get("note") as string) || "";
    const photo = formData.get("photo") as File | null;

    let driveLink = "";

    // Ha van feltöltött kép (itt futhat a Google Drive feltöltő kódod)
    if (photo && photo.size > 0) {
      // driveLink = await uploadToDrive(photo);
    }

    // Elmentjük a megadott mezőket az adatbázisba
    await sql`
      INSERT INTO tasks (type, name, address, phone, email, note, drive_link)
      VALUES (${type}, ${name}, ${address}, ${phone}, ${email}, ${note}, ${driveLink})
    `;

    return NextResponse.json({
      message: "Munka sikeresen elmentve!",
      driveLink,
    });
  } catch (error) {
    console.error("Hiba a mentés során:", error);
    return NextResponse.json(
      { error: "Hiba történt a munka mentésekor." },
      { status: 500 }
    );
  }
}
