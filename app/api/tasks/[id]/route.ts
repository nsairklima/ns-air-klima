import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { v2 as cloudinary } from "cloudinary";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

const sql = neon(process.env.POSTGRES_URL || "");

try {
  cloudinary.config();
} catch (e) {
  console.error("Cloudinary config hiba:", e);
}

function getPublicIdFromUrl(url: string): string | null {
  try {
    const parts = url.split("/");
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return null;

    const pathSegments = parts.slice(uploadIndex + 2);
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

    const existingTask = await sql`SELECT images FROM "Task" WHERE id = ${taskId}`;
    
    if (existingTask.length > 0 && existingTask[0].images) {
      let images: string[] = [];
      try {
        images = typeof existingTask[0].images === "string" 
          ? JSON.parse(existingTask[0].images) 
          : existingTask[0].images;
      } catch {}

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

    // Időpont mezők kezelése szerkesztéskor
    const scheduledAtRaw = formData.get("scheduledAt") as string;
    const completedAtRaw = formData.get("completedAt") as string;
    const scheduledAt = scheduledAtRaw ? scheduledAtRaw.replace("T", " ") : null;
    const completedAt = completedAtRaw ? completedAtRaw.replace("T", " ") : null;

    const taskType = type;
    const taskTitle = name || "Módosított munka";
    const clientName = name || "";
    const taskAddress = address || "";
    const taskPhone = phone || "";
    
    const description = note ? `${note}${email ? ` | Email: ${email}` : ""}` : email ? `Email: ${email}` : "";

    const currentTaskFromDb = await sql`SELECT images FROM "Task" WHERE id = ${taskId}`;
    let oldImagesInDb: string[] = [];
    if (currentTaskFromDb.length > 0 && currentTaskFromDb[0].images) {
      try {
        oldImagesInDb = typeof currentTaskFromDb[0].images === "string"
          ? JSON.parse(currentTaskFromDb[0].images)
          : currentTaskFromDb[0].images;
      } catch {}
    }

    let keptImages: string[] = [];
    const existingImagesRaw = formData.get("existingImages") as string;
    if (existingImagesRaw) {
      try {
        keptImages = JSON.parse(existingImagesRaw);
      } catch {}
    }

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
          "scheduled_at" = ${scheduledAt},
          "completed_at" = ${completedAt},
          "updatedAt" = NOW()
      WHERE id = ${taskId}
    `;

    // Email küldése a módosításról
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: { rejectUnauthorized: false },
      });

      const typeLabel = type === "telepites" ? "🛠️ Telepítés" : "🧹 Karbantartás";

      await transporter.sendMail({
        from: `"Klíma Rendszer" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        subject: `✏️ Munka Módosítva: ${typeLabel} (${name || "Névtelen"})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #f39c12; color: #ffffff; padding: 20px; text-align: center;">
              <h2 style="margin: 0;">Egy munka adatai frissültek</h2>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">${typeLabel}</p>
            </div>
            <div style="padding: 20px; font-size: 14px; color: #333;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px; font-weight: bold; width: 35%;">Munkatípus:</td><td style="padding: 10px;">${typeLabel}</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px; font-weight: bold;">Név:</td><td style="padding: 10px;">${name || "-"}</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px; font-weight: bold;">Cím:</td><td style="padding: 10px;">${address || "-"}</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px; font-weight: bold;">Telefon:</td><td style="padding: 10px;">${phone || "-"}</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px; font-weight: bold;">Email:</td><td style="padding: 10px;">${email || "-"}</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px; font-weight: bold;">Tervezett időpont:</td><td style="padding: 10px;">${scheduledAt || "-"}</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px; font-weight: bold;">Megvalósult időpont:</td><td style="padding: 10px;">${completedAt || "-"}</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px; font-weight: bold;">Megjegyzés:</td><td style="padding: 10px;">${note || "-"}</td></tr>
              </table>
            </div>
            <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #7f8c8d;">
              Automata üzenet az NS-AIR Rendszerből.
            </div>
          </div>
        `,
      });
    } catch (mailError) {
      console.error("Email küldési hiba módosításkor:", mailError);
    }

    return NextResponse.json({ message: "Sikeres frissítés", images: finalImages });
  } catch (error: any) {
    console.error("Szerkesztési hiba részletei:", error);
    return NextResponse.json({ error: error?.message || "Szerkesztési hiba" }, { status: 500 });
  }
}
