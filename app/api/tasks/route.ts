import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { v2 as cloudinary } from "cloudinary";

export const dynamic = "force-dynamic";

const sql = neon(process.env.POSTGRES_URL || "");
cloudinary.config();

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

    if (photo && photo.size > 0) {
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

        imageUrl = uploadResult.secure_url || "";
      } catch (uploadError: any) {
        console.error("Cloudinary hiba:", uploadError?.message || uploadError);
      }
    }

    // Direkt mentés a táblád pontos oszlopneveibe: name, email, note, stb.
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
    console.error("Mentési hiba:", error);
    return NextResponse.json(
      { error: error?.message || "Hiba történt a mentés során." },
      { status: 500 }
    );
  }
}
