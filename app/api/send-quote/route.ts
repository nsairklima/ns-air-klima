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
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: '"NS-AIR KLÍMA" <info@nsairklima.hu>',
      to: email,
      subject: `Árajánlat - NS-AIR KLÍMA - #${quoteId}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #3498db;">Tisztelt ${customerName}!</h2>
          <p>Köszönjük megtisztelő megkeresését!</p>
          <p>Az Ön részére elkészített árajánlatot az alábbi gombra kattintva tekintheti meg és töltheti le:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://nsairklima.vercel.app/quotes/${quoteId}/print" 
               style="background: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
               AJÁNLAT MEGTEKINTÉSE
            </a>
          </div>
          <p><strong>Ajánlat összege:</strong> ${totalAmount.toLocaleString()} Ft</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #7f8c8d;">Üdvözlettel,<br><strong>NS-AIR KLÍMA</strong><br>+36 70 312 1825</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ message: "Sikeres küldés!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
