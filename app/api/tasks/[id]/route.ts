import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { v2 as cloudinary } from "cloudinary";

// Cloudinary konfiguráció (biztosítsd, hogy nálad is itt van)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Biztos ami biztos, kiolvassuk a params-t akkor is, ha Promise (Next.js 15+) vagy sima objektum
    const params = await props.params;
    const taskId = params.id;

    const formData = await request.formData();

    const type = (formData.get("type") as string) || "telepites";
    const name = (formData.get("name") as string) || "";
    const address = (formData.get("address") as string) || "";
    const phone = (formData.get("phone") as string) || "";
    const email = (formData.get("email") as string) || "";
    const note = (formData.get("note") as string) || "";

    const taskType = type;
    const taskTitle = name || "Módosított munka";
    const clientName = name;
    const taskAddress = address;
    const taskPhone = phone;
    
    const description = note ? `${note}${email ? ` | Email: ${email}` : ""}` : email ? `Email: ${email}` : "";

    // 1. Megmaradt régi képek beolvasása (amiket nem törölt ki a felhasználó)
    let keptImages: string[] = [];
    const existingImagesRaw = formData.get("existingImages") as string;
    if (existingImagesRaw) {
      try {
        keptImages = JSON.parse(existingImagesRaw);
      } catch {}
    }

    // 2. Új képek feltöltése a Cloudinary-ra
    const photos = formData.getAll("photos") as File[];
    const newImageUrls: string[] = [];

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
            newImageUrls.push(uploadResult.secure_url);
          }
        } catch (uploadError: any) {
          console.error("Képfeltöltési hiba szerkesztéskor:", uploadError?.message || uploadError);
        }
      }
    }

    // A megmaradt régi képek és az újak összefűzése
    const finalImages = [...keptImages, ...newImageUrls];

    console.log("Mentésre kerülő képek ID alapján:", taskId, finalImages);

    // Adatbázis frissítése a helyes taskId-val
    await sql`
      UPDATE "Task"
      SET "type" = ${taskType},
          "title" = ${taskTitle},
          "clientName" = ${clientName},
          "address" = ${taskAddress},
          "phone" = ${taskPhone},
          "description" = ${description},
          "images" = ${JSON.stringify(finalImages)},
          "updatedAt" = NOW()
      WHERE "id" = ${taskId}
    `;

    return NextResponse.json({ message: "Sikeres frissítés", images: finalImages });
  } catch (error: any) {
    console.error("Szerkesztési hiba részletei:", error);
    return NextResponse.json({ error: error?.message || "Szerkesztési hiba" }, { status: 500 });
  }
}
