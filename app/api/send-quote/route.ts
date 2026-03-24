import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { email, customerName, quoteId, totalAmount } = await req.json();

    const transporter = nodemailer.createTransport({
      host: "mail.nsairklima.hu",
      port: 465,
      secure: true, 
      auth: {
        user: "info@nsairklima.hu",
        pass: process.env.EMAIL_PASS, // Ezt fogja beolvasni a Vercel beállításaiból
      },
    });

    const mailOptions = {
      from: '"NS-AIR KLÍMA" <info@nsairklima.hu>',
      to: email,
      subject: `Árajánlat - NS-AIR KLÍMA - #${quoteId}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #3498db;">Tisztelt ${customerName}!</h2>
          <p>Köszönjük megkeresését! Mellékelten küldjük a kért árajánlatot.</p>
          <hr />
          <p><strong>Ajánlat azonosító:</strong> #${quoteId}/2026</p>
          <p><strong>Végösszeg:</strong> ${totalAmount.toLocaleString()} Ft</p>
          <hr />
          <p>Az ajánlat megtekintéséhez kattintson az alábbi gombra:</p>
          <a href="https://nsairklima.hu/quotes/${quoteId}/print" 
             style="display: inline-block; background: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
             AJÁNLAT MEGTEKINTÉSE
          </a>
          <br /><br />
          <p>Üdvözlettel,<br /><strong>NS-AIR KLÍMA</strong></p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ message: "Sikeres küldés!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
