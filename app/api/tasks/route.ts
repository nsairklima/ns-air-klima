import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { google } from "googleapis";
import { Readable } from "stream";
import { neon } from "@neondatabase/serverless";

// Neon PostgreSQL csatlakozás a megadott POSTGRES_URL alapján
const sql = neon(process.env.POSTGRES_URL || "");

/**
 * Feltölti a feltöltött képet a Google Drive tárhelyre OAuth2 API segítségével.
 */
async function uploadToGoogleDrive(file: File): Promise<string | null> {
  try {
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID; // Opcionális: a cél Google Drive mappa ID-ja

    if (!clientId || !clientSecret || !refreshToken) {
      console.warn("Google Drive API környezeti változók nincsenek beállítva. Fallback mentés e-mailben.");
      return null;
    }

    
    const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  "https://developers.google.com/oauthplayground"
);

    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    const fileMetaData: any = {
      name: `munka_${Date.now()}_${file.name}`,
    };

    if (folderId) {
      fileMetaData.parents = [folderId];
    }

    const media = {
      mimeType: file.type || "image/jpeg",
      body: stream,
    };

    const response = await drive.files.create({
      requestBody: fileMetaData,
      media: media,
      fields: "id, webViewLink",
    });

    return response.data.webViewLink || response.data.id || null;
  } catch (err) {
    console.error("Hiba a Google Drive feltöltés során:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const type = formData.get("type") as string;
    const address = formData.get("address") as string;
    const photo = formData.get("photo") as File | null;

    if (!address || !type) {
      return NextResponse.json(
        { error: "A cím és a munkatípus megadása kötelező!" },
        { status: 400 }
      );
    }

    let driveLink: string | null = null;
    let photoBuffer: Buffer | null = null;

    if (photo && photo.size > 0) {
      // 1. Megpróbáljuk feltölteni a Google Drive-ra
      driveLink = await uploadToGoogleDrive(photo);

      // Buffer előkészítése az e-mail csatolmányhoz
      const arrayBuffer = await photo.arrayBuffer();
      photoBuffer = Buffer.from(arrayBuffer);
    }

    // 2. Mentés a Neon PostgreSQL Adatbázisba
    try {
      if (process.env.POSTGRES_URL) {
        await sql`
          CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            type VARCHAR(50) NOT NULL,
            address TEXT NOT NULL,
            drive_link TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `;

        await sql`
          INSERT INTO tasks (type, address, drive_link)
          VALUES (${type}, ${address}, ${driveLink || ""});
        `;
      }
    } catch (dbErr) {
      console.error("Adatbázis mentési hiba:", dbErr);
    }

    // 3. Nodemailer e-mail értesítő küldése (Gmail SMTP)
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: Number(process.env.EMAIL_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mapsUrl =
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

    const attachments = [];
    if (photoBuffer && photo) {
      attachments.push({
        filename: photo.name,
        content: photoBuffer,
      });
    }

    const driveHtmlSection = driveLink
      ? `<p>📁 <strong>Google Drive Kép Link:</strong> <a href="${driveLink}" target="_blank">${driveLink}</a></p>`
      : photo
      ? `<p>📷 A kép csatolva található az e-mailben.</p>`
      : `<p>📷 Kép nem lett csatolva.</p>`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `[Új Munka] ${type === "telepites" ? "Telepítés" : "Karbantartás"} - ${address}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #333;">Új munka lett kiadva!</h2>
          <hr style="border: 0; border-top: 1px solid #ccc; margin: 15px 0;" />
          <p><strong>Munkatípus:</strong> ${type === "telepites" ? "🛠️ Telepítés" : "🧹 Karbantartás"}</p>
          <p><strong>Cím:</strong> ${address}</p>
          ${driveHtmlSection}
          <div style="margin-top: 20px;">
            <a href="${mapsUrl}" target="_blank" style="background-color: #4285F4; color: white; padding: 10px 18px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">📍 Megnyitás Google Maps-en</a>
          </div>
        </div>
      `,
      attachments,
    });

    return NextResponse.json({
      success: true,
      message: driveLink
        ? "Munka elmentve! A kép felkerült a Google Drive-ra és az értesítés elküldve."
        : "Munka elmentve és az értesítés elküldve!",
      driveLink: driveLink,
    });
  } catch (error) {
    console.error("Hiba a feladat feldolgozása során:", error);
    return NextResponse.json(
      { error: "Nem sikerült a munkát kiadni." },
      { status: 500 }
    );
  }
}
