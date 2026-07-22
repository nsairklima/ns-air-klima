import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import PDFDocument from "pdfkit";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const id = Number(params.quoteId);
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        client: true,
        items: true,
      },
    });

    if (!quote || !quote.client.email) {
      return NextResponse.json({ error: "Ajánlat vagy ügyfél e-mail nem található" }, { status: 404 });
    }

    // PDF generálása az e-mailhez (bufferbe)
    const doc = new PDFDocument({ margin: 50 });
    const chunks: any[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    
    doc.fontSize(20).text("ÁRAJÁNLAT", { align: "center" });
    doc.moveDown();
    
    let y = 100;
    const line = (text: string, size = 12) => {
      doc.fontSize(size).text(text, 50, y);
      y += size + 5;
    };

    line(`Dátum: ${new Date().toLocaleDateString("hu-HU")}`);
    line(`Ajánlat száma: #${quote.id}`); 
    line(`Státusz: Folyamatban`);
    y += 20;
    line(`Ügyfél: ${quote.client.name}`);
    
    y += 20;
    line("Tételek:");
    quote.items.forEach(it => {
      line(`- ${it.description}: ${it.lineGross.toLocaleString()} Ft`, 10);
    });
    
    y += 20;
    line(`Összesen bruttó: ${quote.grossTotal.toLocaleString()} Ft`, 14);

    doc.end();

    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    // E-mail küldése a Resend-del (+ BCC másolat az info@nsairklima.hu címre)
    await resend.emails.send({
      from: "Klíma Szerelő <onboarding@resend.dev>", // Ha a saját domain el van igazolva a Resendben, cserélheted "NS Air Klíma <info@nsairklima.hu>" címre
      to: quote.client.email,
      bcc: ["info@nsairklima.hu"], // 👈 ÚJ: Titkos másolat neked
      subject: `Árajánlat - #${quote.id}`,
      html: `<p>Tisztelt ${quote.client.name}!</p><p>Mellékelten küldjük a kért árajánlatot.</p>`,
      attachments: [
        {
          filename: `ajanlat_${quote.id}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Küldési hiba:", error);
    return NextResponse.json({ error: "Hiba az e-mail küldésekor" }, { status: 500 });
  }
}
