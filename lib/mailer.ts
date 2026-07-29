import nodemailer from "nodemailer";

export interface MaintenanceDueItem {
  clientName: string;
  clientPhone: string;
  clientAddress?: string | null;
  unitName: string;
  dueDate: string;
  isOverdue: boolean;
}

// ÚJ: Összevont karbantartási értesítő küldése (egy e-mailben az összes gép)
export async function sendAdminBulkMaintenanceReminder(items: MaintenanceDueItem[]) {
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

  const rows = items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #ddd; ${item.isOverdue ? "background-color: #ffe6e6;" : ""}">
        <td style="padding: 10px; font-weight: bold;">${item.clientName}</td>
        <td style="padding: 10px;">${item.clientPhone}</td>
        <td style="padding: 10px;">${item.clientAddress || "Nincs megadva"}</td>
        <td style="padding: 10px;">${item.unitName}</td>
        <td style="padding: 10px; font-weight: bold; color: ${item.isOverdue ? "#c0392b" : "#d35400"};">
          ${item.dueDate} ${item.isOverdue ? "(LEJÁRT)" : "(1 hónapon belül)"}
        </td>
      </tr>
    `
    )
    .join("");

  await transporter.sendMail({
    from: `"Klíma Rendszer" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER, // karbantartas@nsairklima.hu
    subject: `⚠️ Esedékes karbantartások összefoglalója (${items.length} db gép)`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #2c3e50; color: #ffffff; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">Eszközök karbantartási értesítője</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.8;">Az alábbi klímagépek karbantartása 30 napon belül esedékes vagy már lejárt.</p>
        </div>
        <div style="padding: 20px;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
            <thead>
              <tr style="background-color: #f4f6f7; border-bottom: 2px solid #bdc3c7;">
                <td style="padding: 10px;"><strong>Ügyfél</strong></td>
                <td style="padding: 10px;"><strong>Telefon</strong></td>
                <td style="padding: 10px;"><strong>Cím</strong></td>
                <td style="padding: 10px;"><strong>Készülék</strong></td>
                <td style="padding: 10px;"><strong>Esedékesség</strong></td>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #7f8c8d;">
          Automata üzenet a Klíma Rendszerből.
        </div>
      </div>
    `,
  });
}

// Megtartjuk az eredeti egyedi küldőt is, ha máshol szükség lenne rá
export async function sendAdminMaintenanceReminder(clientName: string, clientPhone: string, unitName: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  await transporter.sendMail({
    from: `"Klíma Rendszer" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: `⚠️ KARBANTARTÁS: ${clientName}`,
    html: `
      <div style="font-family: sans-serif; border: 2px solid #3498db; padding: 20px; border-radius: 10px;">
        <h2 style="color: #3498db;">Szia! Új karbantartás esedékes</h2>
        <p>A rendszer elemezte az adatbázist, és az alábbi gépet találta:</p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px;">
          <p><strong>Ügyfél:</strong> ${clientName}</p>
          <p><strong>Telefon:</strong> ${clientPhone || "Nincs megadva"}</p>
          <p><strong>Készülék:</strong> ${unitName}</p>
        </div>
        <p style="margin-top: 15px;"><em>Időpont egyeztetés céljából hívd fel az ügyfelet!</em></p>
      </div>
    `
  });
}
