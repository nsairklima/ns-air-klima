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
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />

          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 80px; vertical-align: top; padding-right: 15px;">
                <img src="https://nsairklima.vercel.app/ns-logo.png" alt="NS-AIR KLÍMA" style="width: 80px; height: auto; display: block;" />
              </td>
              <td style="vertical-align: top; border-left: 2px solid #3498db; padding-left: 15px;">
                <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">
                  <span style="color: #3498db;">NS-AIR</span> <span style="color: #e74c3c;">KLÍMA</span>
                </div>
                <div style="font-size: 13px; color: #7f8c8d; margin-bottom: 10px;">9143 Enese, Külsőréti dűlő 12.</div>
                
                <div style="font-size: 13px; margin-bottom: 3px;">
                  <strong>Tel:</strong> <a href="tel:+36703121825" style="color: #2c3e50; text-decoration: none;">+36 70 312 1825</a>
                </div>
                <div style="font-size: 13px; margin-bottom: 3px;">
                  <strong>Email:</strong> <a href="mailto:info@nsairklima.hu" style="color: #3498db; text-decoration: none;">info@nsairklima.hu</a>
                </div>
                <div style="font-size: 13px; margin-bottom: 10px;">
                  <strong>Web:</strong> <a href="https://www.nsairklima.hu" style="color: #3498db; text-decoration: none;">www.nsairklima.hu</a>
                </div>

                <div style="background-color: #f8f9fa; padding: 8px; border-radius: 4px; display: inline-block;">
                  <span style="font-size: 12px; color: #2c3e50;">Tekintse meg referenciáinkat:</span><br>
                  <a href="https://www.facebook.com/NSAirklima/" style="font-size: 13px; color: #3b5998; font-weight: bold; text-decoration: none;">
                    facebook.com/NSAirklima
                  </a>
                </div>
              </td>
            </tr>
          </table>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ message: "Sikeres küldés!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
