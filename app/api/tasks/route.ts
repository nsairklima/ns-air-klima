import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { google } from "googleapis";
import { Readable } from "stream";
import { neon } from "@neondatabase/serverless";

// Neon PostgreSQL csatlakozás
const sql = neon(process.env.POSTGRES_URL || "");

async function uploadToGoogleDrive(
  file: File
): Promise<string | null> {
  try {
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!clientId || !clientSecret || !refreshToken) {
      console.warn(
        "Google Drive környezeti változók hiányoznak."
      );
      return null;
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const drive = google.drive({
      version: "v3",
      auth: oauth2Client,
    });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    const requestBody: {
      name: string;
      parents?: string[];
    } = {
      name: `munka_${Date.now()}_${file.name}`,
    };

    if (folderId) {
      requestBody.parents = [folderId];
    }

    const response = await drive.files.create({
      requestBody,
      media: {
        mimeType: file.type || "image/jpeg",
        body: stream,
      },
      fields: "id,webViewLink",
    });

    return response.data.webViewLink || null;
  } catch (error) {
    console.error(
      "Google Drive feltöltési hiba:",
      error
    );
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const type = formData.get("type") as string;
    const address = formData.get("address") as string;
    const photo = formData.get("photo") as File | null;

    if (!type || !address) {
      return NextResponse.json(
        {
          error:
            "A munkatípus és a cím kötelező.",
        },
        {
          status: 400,
        }
      );
    }

    let driveLink: string | null = null;
    let photoBuffer: Buffer | null = null;

    if (photo && photo.size > 0) {
      driveLink = await uploadToGoogleDrive(photo);

      const arrayBuffer =
        await photo.arrayBuffer();

      photoBuffer = Buffer.from(arrayBuffer);
    }

    try {
      if (process.env.POSTGRES_URL) {
        await sql`
          CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            type VARCHAR(50) NOT NULL,
            address TEXT NOT NULL,
            drive_link TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;

        await sql`
          INSERT INTO tasks (
            type,
            address,
            drive_link
          )
          VALUES (
            ${type},
            ${address},
            ${driveLink || ""}
          )
        `;
      }
    } catch (dbError) {
      console.error(
        "Adatbázis hiba:",
        dbError
      );
    }

    const transporter =
      nodemailer.createTransport({
        host:
          process.env.EMAIL_HOST ||
          "smtp.gmail.com",
        port: Number(
          process.env.EMAIL_PORT || 465
        ),
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
await transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: process.env.EMAIL_USER,
  subject: `[Új Munka] ${
    type === "telepites"
      ? "Telepítés"
      : "Karbantartás"
  } - ${address}`,
  html: `
    <div style="font-family:Arial,sans-serif;padding:20px;border:1px solid #ddd;border-radius:8px;">
      <h2>Új munka lett kiadva</h2>

      <p>
        <strong>Munkatípus:</strong>
        ${
          type === "telepites"
            ? "🛠️ Telepítés"
            : "🧹 Karbantartás"
        }
      </p>

      <p>
        <strong>Cím:</strong>
        ${address}
      </p>

      ${driveHtmlSection}

      <p style="margin-top:20px;">
        <a
          href="${mapsUrl}"
          target="_blank"
          style="
            background:#4285F4;
            color:white;
            padding:10px 18px;
            text-decoration:none;
            border-radius:5px;
            display",
  driveLink,
});


    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `[Új Munka] ${
        type === "telepites"
          ? "Telepítés"
          : "Karbantartás"
      } - ${address}`,
      html: `
        <div style="
          font-family: Arial,sans-serif;
          padding:20px;
          border:1px solid #ddd;
          border-radius:8px;
        ">
          <h2>Új munka lett kiadva</h2>

          <p>
            <strong>Munkatípus:</strong>
            ${
              type === "telepites"
                ? "🛠️ Telepítés"
                : "🧹 Karbantartás"
            }
          </p>

          <p>
            <strong>Cím:</strong>
            ${address}
          </p>

          ${driveHtmlSection}

          <div style="margin-top:20px;">
            <a
              href="${mapsUrl}"
              target="_blank"
              style="
                background:#4285F4;
                color:white;
                padding:10px 18px;
                text-decoration:none;
                kép Google Drive-ra feltöltve."
        : "Munka mentve.",
      driveLink,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Nem sikerült a munkát feldolgozni.",
      },
      {
        status: 500,
      }
    );
  }
}

