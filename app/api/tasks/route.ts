import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { google } from "googleapis";
import { Readable } from "stream";

export const dynamic = "force-dynamic";

const sql = neon(process.env.POSTGRES_URL || "");

function getDriveService() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("A Google Drive környezeti változók hiányoznak.");
  }

  const auth = new google.auth.JWT(
    clientEmail,
    undefined,
    privateKey,
    ["https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/drive"]
  );

  return google.drive({ version: "v3", auth });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const type = (formData.get("type") as string) || "installation";
    const name = (formData.get("name") as string) || "";
    const address = (formData.get("address") as string) || "";
    const phone = (formData.get("phone") as string) || "";
    const email = (formData.get("email") as string) || "";
    const note = (formData.get("note") as string) || "";
    const photo = formData.get("photo") as File | null;

    let driveLink = "";

    // Kép feltöltése Google Drive-ra
    if (photo && photo.size > 0) {
      const drive = getDriveService();
      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

      const buffer = Buffer.from(await photo.arrayBuffer());
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      const fileMetadata = {
        name: `${type}_${name ? name.replace(/\s+/g, "_") : "munka"}_${Date.now()}`,
        parents: folderId ? [folderId] : undefined,
      };

      const media = {
        mimeType: photo.type,
        body: stream,
      };

      const driveRes = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: "id, webViewLink",
      });

      if (driveRes.data.id) {
        await drive.permissions.create({
          fileId: driveRes.data.id,
          requestBody: { role: "reader", type: "anyone" },
        });
      }

      driveLink = driveRes.data.webViewLink || "";
    }

    const currentDate = new Date().toISOString().split("T")[0];
    const imagesJson = JSON.stringify(driveLink ? [driveLink] : []);

    // Beszúrás a schema.prisma szerinti "Task" táblába
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
        ${note ? `${note} | Email: ${email}` : `Email: ${email}`}, 
        'pending', 
        ${imagesJson}, 
        NOW()
      )
    `;

    return NextResponse.json({
      message: "Munka sikeresen elmentve!",
      driveLink: driveLink,
    });
  } catch (error: any) {
    console.error("API Hiba (app/api/tasks/route.ts):", error);
    return NextResponse.json(
      { error: error?.message || "Hiba történt a feldolgozás során." },
      { status: 500 }
    );
  }
}
