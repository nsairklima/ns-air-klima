import { NextResponse } from "next/server";
import { google } from "googleapis";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    // 1. Környezeti változók meglétének ellenőrzése
    const missingVars = [];
    if (!clientId) missingVars.push("GOOGLE_DRIVE_CLIENT_ID");
    if (!clientSecret) missingVars.push("GOOGLE_DRIVE_CLIENT_SECRET");
    if (!refreshToken) missingVars.push("GOOGLE_DRIVE_REFRESH_TOKEN");

    if (missingVars.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Hiányzó környezeti változók!",
          missingVariables: missingVars,
        },
        { status: 400 }
      );
    }

    // 2. OAuth2 kliens inicializálása
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // 3. Kapcsolódás tesztelése: Google Drive mappa lekérésea
    let folderInfo = null;
    if (folderId) {
      const res = await drive.files.get({
        fileId: folderId,
        fields: "id, name, mimeType",
      });
      folderInfo = res.data;
    }

    // 4. Teszt fájl létrehozása ellenőrzésképp
    const testFile = await drive.files.create({
      requestBody: {
        name: `test_connection_${Date.now()}.txt`,
        parents: folderId ? [folderId] : undefined,
      },
      media: {
        mimeType: "text/plain",
        body: "Google Drive OAuth2 teszt sikeres!",
      },
      fields: "id, name, webViewLink",
    });

    return NextResponse.json({
      success: true,
      message: "Google Drive OAuth2 kapcsolat tökéletesen működik!",
      folder: folderInfo,
      createdTestFile: {
        id: testFile.data.id,
        name: testFile.data.name,
        link: testFile.data.webViewLink,
      },
    });
  } catch (error: any) {
    console.error("OAuth2 Teszt Hiba:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Ismeretlen hiba történt a teszt során.",
        details: error?.response?.data || null,
      },
      { status: 500 }
    );
  }
}
