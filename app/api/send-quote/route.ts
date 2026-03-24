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

    // Ez a link fog kimenni az ügyfélnek (már ott a mode=view a végén!)
    const viewUrl = `https://nsairklima.vercel.app/quotes/${quoteId}/print?mode=view`;

    const mailOptions = {
      from: '"NS-AIR KLÍMA" <info@nsairklima.hu>',
      to: email,
      subject: `Árajánlat - NS-AIR KLÍMA - #${quoteId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 25px; border-radius: 12px; color: #2c3e50;">
          <h2 style="color: #3498db; margin-bottom: 20px;">Tisztelt ${customerName}!</h2>
          <p style="font-size: 15px; line-height: 1.5;">Köszönjük megtisztelő megkeresését!</p>
          <p style="font-size: 15px; line-height: 1.5;">Az Ön részére elkészített árajánlatot az alábbi gombra kattintva tekintheti meg:</p>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${viewUrl}" 
               style="background-color: #3498db; border-radius: 6px; color: #ffffff; display: inline-block; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; line-height: 54px; text-align: center; text-decoration: none; width: 260px; -webkit-text-size-adjust: none;">
               AJÁNLAT MEGTEKINTÉSE
            </a>
          </div>

          <p style="font-size: 15px;"><strong>Ajánlat bruttó végösszege:</strong> ${totalAmount.toLocaleString()} Ft</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;" />
          <p style="font-size: 13px; color: #7f8c8d; line-height: 1.4;">
            Üdvözlettel,<br>
            <strong>NS-AIR KLÍMA</strong><br>
            9143 Enese, Külsőréti dűlő 12.<br>
            Tel: +36 70 312 1825
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ message: "Sikeres küldés!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
