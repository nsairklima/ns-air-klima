import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { v2 as cloudinary } from "cloudinary";

export const dynamic = "force-dynamic";

const sql = neon(process.env.POSTGRES_URL || "");

try {
  cloudinary.config();
} catch (e) {
  console.error("Cloudinary config hiba:", e);
}

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

    let imageUrl = "";

    if (photo && typeof photo === "object" && "size" in photo && photo.size > 0) {
      try {
        const arrayBuffer = await photo.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: "tasks",
              resource_type: "auto",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });

        imageUrl = uploadResult?.secure_url || "";
      } catch (uploadError: any) {
        console.error("Képfeltöltési hiba:", uploadError?.message || uploadError);
      }
    }

    // Most már a tiszta, eredeti mezőneveket mentjük az adatbázisba
    await sql`
      INSERT INTO "Task" (
        "type", 
        "name", 
        "address", 
        "phone", 
        "email", 
        "note", 
        "drive_link", 
        "created_at"
      )
      VALUES (
        ${type}, 
        ${name}, 
        ${address}, 
        ${phone}, 
        ${email}, 
        ${note}, 
        ${imageUrl}, 
        NOW()
      )
    `;

    return NextResponse.json({
      message: "Munka sikeresen elmentve!",
      driveLink: imageUrl,
    });
  } catch (error: any) {
    console.error("Adatbázis mentési hiba részletei:", error);
    return NextResponse.json(
      { error: error?.message || "Hiba történt a mentés során." },
      { status: 500 }
    );
  }
}
