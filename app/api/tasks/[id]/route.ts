import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { v2 as cloudinary } from "cloudinary";

export const dynamic = "force-dynamic";

const sql = neon(process.env.POSTGRES_URL || "");

// Cloudinary konfiguráció
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Segédfüggvény: Cloudinary URL-ből kiszedi a Public ID-t (pl. "tasks/abc123xyz")
function getPublicIdFromUrl(url: string): string | null {
  try {
    const parts = url.split("/");
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return null;

    // Az "upload" utáni rész a verziószám (pl. v12345678) és a fájlnév kiterjesztéssel
    const pathSegments = parts.slice(uploadIndex + 2); // Kihagyjuk az "upload"-ot és a verziót (v...)
    const fullPath = pathSegments.join("/");
    const lastDotIndex = fullPath.lastIndexOf(".");
    
    return lastDotIndex !== -1 ? fullPath.substring(0, lastDotIndex) : fullPath;
  } catch {
    return null;
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await props.params;
    const taskId = params.id;

    // 1. Lekérdjük a feladatot, hogy megtudjuk, milyen képei vannak
    const existingTask = await sql`SELECT images FROM "Task" WHERE id = ${taskId}`;
    
    if (existingTask.length > 0 && existingTask[0].images) {
      let images: string[] = [];
      try {
        images = typeof existingTask[0].images === "string" 
          ? JSON.parse(existingTask[0].images) 
          : existingTask[0].images;
      } catch {}

      // 2. Töröljük az összes képet a Cloudinary tárhelyről is
      for (const imgUrl of images) {
        const publicId = getPublicIdFromUrl(imgUrl);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.error("Hiba a kép Cloudinary törlésekor:", err);
          }
        }
      }
    }

    // 3. Töröljük a sort az adatbázisból
    await sql`DELETE FROM "Task" WHERE id = ${taskId}`;
    
    return NextResponse.json({ message: "Sikeres törlés és fájlok eltávolítása" });
  } catch (error: any) {
    console.error("Törlési hiba:", error);
    return NextResponse.json({ error: error?.message || "Törlési hiba" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
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
    const clientName = name || "";
    const taskAddress = address || "";
    const taskPhone = phone || "";
    
    const description = note ? `${note}${email ? ` | Email: ${email}` : ""}` : email ? `Email: ${email}` : "";

    // 1. Lekérdjük az adatbázisban lévő *eredeti* képeket, hogy lássuk, mit törölt ki a felhasználó
    const currentTaskFromDb = await sql`SELECT images FROM "Task" WHERE id = ${taskId}`;
    let oldImagesInDb: string[] = [];
    if (currentTaskFromDb.length > 0 && currentTaskFromDb[0].images) {
      try {
        oldImagesInDb = typeof currentTaskFromDb[0].images === "string"
          ? JSON.parse(currentTaskFromDb[0].images)
          : currentTaskFromDb[0].images;
      } catch {}
    }

    // 2. Megmaradt régi képek beolvasása, amiket a felhasználó megtartott a formon
    let keptImages: string[] = [];
    const existingImagesRaw = formData.get("existingImages") as string;
    if (existingImagesRaw) {
      try {
        keptImages = JSON.parse(existingImagesRaw);
      } catch {}
    }

    // 3. Megkeressük azokat a képeket, amik eddig benn voltak, de most kikerültek -> ezeket töröljük a Cloudinary-ról
    const imagesToDelete = oldImagesInDb.filter((img) => !keptImages.includes(img));
    for (const imgUrl of imagesToDelete) {
      const publicId = getPublicIdFromUrl(imgUrl);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error("Hiba a régi kép törlésekor a Cloudinaryról:", err);
        }
      }
    }

    // 4. Új képek feltöltése a Cloudinary-ra
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
      WHERE id = ${taskId}
    `;

    return NextResponse.json({ message: "Sikeres frissítés", images: finalImages });
  } catch (error: any) {
    console.error("Szerkesztési hiba részletei:", error);
    return NextResponse.json({ error: error?.message || "Szerkesztési hiba" }, { status: 500 });
  }
}
