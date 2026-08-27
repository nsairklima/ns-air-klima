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
    
    // Több fájl lekérése
    const photos = formData.getAll("photos") as File[];
    const imageUrls: string[] = [];

    for (const photo of photos) {
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

          if (uploadResult?.secure_url) {
            imageUrls.push(uploadResult.secure_url);
          }
        } catch (uploadError: any) {
          console.error("Képfeltöltési hiba:", uploadError?.message || uploadError);
        }
      }
    }

    const currentDate = new Date().toISOString().split("T")[0];

    await sql`
      INSERT INTO "Task" (
        "type", 
        "title",
        "clientName", 
        "address", 
        "phone", 
        "date",
        "description", 
        "images", 
        "updatedAt"
      )
      VALUES (
        ${type}, 
        ${name || "Új munka"},
        ${name}, 
        ${address}, 
        ${phone}, 
        ${currentDate},
        ${note ? `${note} ${email ? `| Email: ${email}` : ""}` : email ? `Email: ${email}` : ""}, 
        ${JSON.stringify(imageUrls)}, 
        NOW()
      )
    `;

    return NextResponse.json({
      message: "Munka sikeresen elmentve!",
      driveLinks: imageUrls,
    });
  } catch (error: any) {
    console.error("Adatbázis mentési hiba részletei:", error);
    return NextResponse.json(
      { error: error?.message || "Hiba történt a mentés során." },
      { status: 500 }
    );
  }
}
