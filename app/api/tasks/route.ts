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

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const type = (formData.get("type") as string) || "telepites";
    const name = (formData.get("name") as string) || "";
    const address = (formData.get("address") as string) || "";
    const phone = (formData.get("phone") as string) || "";
    const email = (formData.get("email") as string) || "";
    const note = (formData.get("note") as string) || "";
    
    // Itt olvassuk ki a frontenden kiválasztott címzettet
    const recipientEmail = (formData.get("recipientEmail") as string) || "";
    
    const scheduledAtRaw = formData.get("scheduledAt") as string;
    const completedAtRaw = formData.get("completedAt") as string;
    const scheduledAt = scheduledAtRaw ? scheduledAtRaw.replace("T", " ") : null;
    const completedAt = completedAtRaw ? completedAtRaw.replace("T", " ") : null;
    
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
        "scheduled_at",
        "completed_at",
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
        ${scheduledAt},
        ${completedAt},
        NOW()
      )
    `;

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      const typeLabel = type === "telepites" ? "🛠️ Telepítés" : "🧹 Karbantartás";

      // Meghatározzuk a végső címzettet: először a frontenden kiválasztott, ha nincs, akkor az .env-es fallbackek
      const targetEmail = recipientEmail || process.env.NOTIFICATION_EMAILS || process.env.EMAIL_USER;

      await transporter.sendMail({
        from: `"NS-AIR Rendszer" <${process.env.EMAIL_USER}>`,
        to: targetEmail, // Itt küldjük a kiválasztott email címre
        subject: `📋 Új munka értesítés: ${typeLabel} (${name || "Névtelen"})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #2c3e50; color: #ffffff; padding: 20px; text-align: center;">
              <h2 style="margin: 0;">Új munka érkezett a rendszerbe</h2>
              <p style="margin: 5px 0 0 0; opacity: 0.8;">${typeLabel}</p>
            </div>
            <div style="padding: 20px; font-size: 14px; color: #333;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 10px; font-weight: bold; width: 35%;">Munkatípus:</td>
                  <td style="padding: 10px;">${typeLabel}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 10px; font-weight: bold;">Név:</td>
                  <td style="padding: 10px;">${name || "-"}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 10px; font-weight: bold;">Cím:</td>
                  <td style="padding: 10px;">${address || "-"}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 10px; font-weight: bold;">Telefon:</td>
                  <td style="padding: 10px;">${phone || "-"}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 10px; font-weight: bold;">Email:</td>
                  <td style="padding: 10px;">${email || "-"}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 10px; font-weight: bold;">Tervezett időpont:</td>
                  <td style="padding: 10px;">${scheduledAt || "-"}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 10px; font-weight: bold;">Megvalósult időpont:</td>
                  <td style="padding: 10px;">${completedAt || "-"}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 10px; font-weight: bold;">Megjegyzés:</td>
                  <td style="padding: 10px;">${note || "-"}</td>
                </tr>
              </table>
            </div>
            <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #7f8c8d;">
              Automata üzenet az NS-AIR Rendszerből. (A csatolt képek az alkalmazásban érhetők el).
            </div>
          </div>
        `,
      });
    } catch (mailError) {
      console.error("Email küldési hiba az új munkánál:", mailError);
    }

    return NextResponse.json({
      message: "Munka sikeresen elmentve és email elküldve!",
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
