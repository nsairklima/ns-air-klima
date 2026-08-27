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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await sql`DELETE FROM "Task" WHERE id = ${params.id}`;
    return NextResponse.json({ message: "Sikeres törlés" });
  } catch (error: any) {
    console.error("Törlési hiba:", error);
    return NextResponse.json({ error: error?.message || "Törlési hiba" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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

    // 1. Meglévő képek lekérése az adatbázisból, hogy ne veszítsük el őket
    const existingTask = await sql`SELECT images FROM "Task" WHERE id = ${params.id}`;
    let currentImages: string[] = [];
    if (existingTask.length > 0) {
      const rawImages = existingTask[0].images;
      if (Array.isArray(rawImages)) {
        currentImages = rawImages;
      } else if (typeof rawImages === "string" && rawImages.startsWith("[")) {
        try { currentImages = JSON.parse(rawImages); } catch {}
      } else if (typeof rawImages === "string" && rawImages.trim() !== "") {
        currentImages = [rawImages];
      }
    }

    // 2. Új képek feldolgozása és feltöltése a Cloudinary-ra
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

    // A régi és az újonnan feltöltött képek összefűzése
    const finalImages = [...currentImages, ...newImageUrls];

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
      WHERE "id" = ${params.id}
    `;

    return NextResponse.json({ message: "Sikeres frissítés", images: finalImages });
  } catch (error: any) {
    console.error("Szerkesztési hiba részletei:", error);
    return NextResponse.json({ error: error?.message || "Szerkesztési hiba" }, { status: 500 });
  }
}
