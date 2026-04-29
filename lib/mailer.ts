import nodemailer from "nodemailer";

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
    to: process.env.EMAIL_USER, // Erre a címre érkezik: karbantartas@nsairklima.hu
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
    `,
  });
}
