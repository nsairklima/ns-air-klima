// app/api/notifications/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Resend } from "resend";

/**
 * POST /api/notifications
 * - Megkeresi a 14 napon belül esedékes (vagy már lejárt) karbantartásokat
 * - E-mailt küld Resenden keresztül az ügyfélnek
 * - Naplózza az elküldött értesítést (EmailNotifications)
 *
 * Környezeti változók:
 *   RESEND_API_KEY  - Kötelező (Resend -> API Keys)
 *   RESEND_FROM     - Opcionális feladó (pl. "NS-AIR KLÍMA <noreply@resend.dev>")
 *                     Ha nincs megadva, fallback: "onboarding@resend.dev"
 */
export async function POST() {
  try {
    // 1) Dátumok: ma és 14 nap múlva
    const today = new Date();
    const soon = new Date();
    soon.setDate(today.getDate() + 14);

    // 2) Esedékes/hamarosan esedékes karbantartások lekérdezése
    //    Kapcsolt mezőkkel: unit + client (így elérjük az ügyfél emailjét)
    const dueMaintenances = await prisma.maintenanceLog.findMany({
      where: {
        nextDue: { lte: soon }, // következő esedékesség ma vagy 14 napon belül
      },
      include: {
        unit: {
          include: { client: true },
        },
      },
      orderBy: { nextDue: "asc" },
    });

    // Ha nincs kinek küldeni, válaszoljunk korrekten
    if (!dueMaintenances.length) {
      return NextResponse.json({
        message: "Nincs esedékes karbantartás a megadott időablakban.",
        count: 0,
      });
    }

    // 3) Resend kliens
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Hiányzik a RESEND_API_KEY környezeti változó." },
        { status: 500 }
      );
    }
    const resend = new Resend(apiKey);

    // 4) Feladó cím kialakítása
    const FROM =
      process.env.RESEND_FROM?.trim() || "NS-AIR KLÍMA <onboarding@resend.dev>";

    // 5) Végigmegyünk a rekordokon és kiküldjük a leveleket
    let sentCount = 0;
    const results: Array<{ id: number; email?: string; status: string }> = [];

    for (const item of dueMaintenances) {
      const client = item.unit.client;
      const to = (client.email || "").trim();

      // Csak akkor próbálunk küldeni, ha van email cím
      if (!to) {
        results.push({ id: item.id, status: "skipped_no_email" });
        continue;
      }

      // Tárgy, HTML
      const subject = "Karbantartási értesítés – NS‑AIR KLÍMA";
      const nextDue = item.nextDue
        ? item.nextDue.toISOString().slice(0, 10)
        : "n.a.";

      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #222;">
          <h2 style="margin:0 0 8px 0;">Tisztelt ${escapeHtml(
            client.name || "Ügyfelünk"
          )}!</h2>
          <p>Szeretnénk értesíteni, hogy az Ön klímaberendezése <strong>hamarosan karbantartást igényel</strong>.</p>
          <table style="border-collapse: collapse; margin: 12px 0;">
            <tr>
              <td style="padding:6px 10px; border:1px solid #ddd;">Készülék</td>
              <td style="padding:6px 10px; border:1px solid #ddd;">
                ${escapeHtml(item.unit.brand || "")} ${escapeHtml(
        item.unit.model || ""
      )}
              </td>
            </tr>
            <tr>
              <td style="padding:6px 10px; border:1px solid #ddd;">Esedékes dátum</td>
              <td style="padding:6px 10px; border:1px solid #ddd;">${nextDue}</td>
            </tr>
          </table>
          <p>Kérjük, jelezzen vissza időpont egyeztetés céljából.</p>
          <p style="margin-top:24px;">Üdvözlettel,<br/>NS‑AIR KLÍMA</p>
        </div>
      `;

      try {
        // 6) Küldés Resenden keresztül
        await resend.emails.send({
          from: FROM,
          to,
          subject,
          html,
        });

        // 7) Naplózás az adatbázisba
        await prisma.emailNotifications.create({
          data: {
            clientId: client.id,
            clientUnitId: item.unit.id,
            notificationType: "maintenance_due",
            sentToEmail: to,
            status: "success",
          },
        });

        results.push({ id: item.id, email: to, status: "sent" });
        sentCount += 1;
      } catch (sendErr: any) {
        // Hibás küldés naplózása
        await prisma.emailNotifications.create({
          data: {
            clientId: client.id,
            clientUnitId: item.unit.id,
            notificationType: "maintenance_due",
            sentToEmail: to || "no-email",
            status: "failed",
          },
        });

        results.push({
          id: item.id,
          email: to || undefined,
          status: `failed: ${sendErr?.message || "unknown"}`,
        });
      }
    }

    // 8) Válasz
    return NextResponse.json({
      message: "Automatikus karbantartási értesítések feldolgozva.",
      count: sentCount,
      details: results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Hiba az értesítések feldolgozásakor: ${error?.message || ""}` },
      { status: 500 }
    );
  }
}

/** Egyszerű HTML escape a biztonság kedvéért */
function escapeHtml(str: string) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
