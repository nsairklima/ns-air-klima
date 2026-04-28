import nodemailer from "nodemailer";

export async function sendMaintenanceReminder(to: string, clientName: string, unitName: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: true, 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Klíma Szerviz" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Emlékeztető: Esedékes karbantartás",
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #2ecc71;">Tisztelt ${clientName}!</h2>
        <p>Ez egy automatikus emlékeztető, hogy a(z) <strong>${unitName}</strong> készülékének 
        időszakos karbantartása 1 hónapon belül esedékessé válik.</p>
        <p>Kérjük, vegye fel velünk a kapcsolatot időpont egyeztetés céljából.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #888;">Ez egy automatikus üzenet, kérjük ne válaszoljon rá.</p>
      </div>
    `,
  });
}
