import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { v2 as cloudinary } from "cloudinary";

export const dynamic = "force-dynamic";

const sql = neon(process.env.POSTGRES_URL || "");
cloudinary.config();

export async function POST(request: Request) {
  try {
    let bodyData: any = {};
    let photo: File | null = null;

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        bodyData[key] = value;
      });
      photo = formData.get("photo") as File | null;
    } else {
      bodyData = await request.json().catch(() => ({}));
    }

    // Minden lehetséges mezőnév variáció kezelése
    const type = bodyData.type || "installation";
    const name = bodyData.name || bodyData.clientName || bodyData.client_name || "";
    const address = bodyData.address || bodyData.location || "";
    const phone = bodyData.phone || bodyData.telephone || "";
    const email = bodyData.email || bodyData.clientEmail || "";
    const note = bodyData.note || bodyData.notes || bodyData.description || "";

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

        imageUrl = uploadResult.secure_url || "";
      } catch (uploadError: any) {
        console.error("Cloudinary hiba:", uploadError?.message || uploadError);
      }
    }

    const currentDate = new Date().toISOString().split("T")[0];
    const imagesJson = JSON.stringify(imageUrl ? [imageUrl] : []);

    // Email és megjegyzés intelligens összefűzése a leírásba, hogy semmi ne vesszen el
    let descriptionText = note;
    if (email) {
      descriptionText = descriptionText ? `${descriptionText} | Email: ${email}` : `Email: ${email}`;
    }

    await sql`
      INSERT INTO "Task" (
        "type", 
        "title", 
        "clientName", 
        "phone", 
        "address", 
        "date", 
        "description", 
        "status", 
        "images", 
        "updatedAt"
      )
      VALUES (
        ${type}, 
        ${name || "Új munka"}, 
        ${name}, 
        ${phone}, 
        ${address}, 
        ${currentDate}, 
        ${descriptionText}, 
        'pending', 
        ${imagesJson}, 
        NOW()
      )
    `;

    return NextResponse.json({
      message: "Munka sikeresen elmentve!",
      imageUrl: imageUrl,
    });
  } catch (error: any) {
    console.error("Mentési hiba:", error);
    return NextResponse.json(
      { error: error?.message || "Hiba történt a mentés során." },
      { status: 500 }
    );
  }
}
