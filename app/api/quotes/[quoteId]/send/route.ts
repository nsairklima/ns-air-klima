export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Resend } from "resend";

export async function POST(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const { to } = await req.json().catch(() => ({} as any));
    const quoteId = Number(params.quoteId);

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { items: true, client: true },
    });
    if (!quote) {
      return NextResponse.json(
        { error: "Ajánlat nem található." },
        { status: 404 }
      );
    }

    const recipient = to || quote.client?.email;
    if (!recipient) {
      return NextResponse.json(
        { error: "Nincs címzett e-mail. Adj meg egy e-mail címet." },
        { status: 400 }
      );
    }

    // --- PDF létrehozása (pdf-lib) ---
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = 750;
    const line = (text: string, size = 12) => {
      page.drawText(text, { x: 50, y, size, font, color: rgb(0, 0, 0) });
      y -= size + 8;
    };

    line("ÁRAJÁNLAT", 24);
    y -= 10;

    line(`Ügyfél: ${quote.client?.name ?? "-"}`, 14);
    if (quote.client?.address) line(`Cím: ${quote.client.address}`);
    if (quote.client?.email) line(`Email: ${quote.client.email}`);
    if (quote.client?.phone) line(`Telefon: ${quote.client.phone}`);

    y -= 10;
    line(`Ajánlat száma: ${quote.quoteNo}`);
    line(`Státusz: ${quote.status}`);
    y -= 10;

    line("Tételek:", 18);
    quote.items.forEach((i) =>
      line(
        `${i.name} — ${i.qty} × ${i.finalPriceNet} Ft = ${
          i.qty * i.finalPriceNet
        } Ft`
      )
    );

    y -= 10;
    line(`Nettó összesen: ${quote.netTotal ?? 0} Ft`, 14);
    line(`ÁFA: ${quote.vatAmount ?? 0} Ft`);
    line(`Bruttó összesen: ${quote.grossTotal ?? 0} Ft`);

    const pdfBytes = await pdfDoc.save();

    // --- E-mail küldés Resend-del ---
    const resend = new Resend(process.env.RESEND_API_KEY!);

    const subject = `NS-AIR KLÍMA ajánlat – ${quote.quoteNo}`;
    const html = `
      <p>Tisztelt ${quote.client?.name ?? "Ügyfél"},</p>
      <p>Csatoltan küldjük az ajánlatot (${quote.quoteNo}).</p>
      <p>Üdvözlettel,<br/>NS-AIR KLÍMA</p>
    `;

    const result = await resend.emails.send({
      from: "onboarding@resend.dev", // teszteléshez jó
      to: [recipient],
      subject,
      html,
      attachments: [
        {
          filename: `ajanlat-${quote.quoteNo}.pdf`,
          content: Buffer.from(pdfBytes).toString("base64"),
        },
      ],
    });

    return NextResponse.json({ ok: true, id: (result as any)?.id ?? null });
  } catch (e) {
    console.error("Send quote email error:", e);
    return NextResponse.json({ error: "Küldési hiba." }, { status: 500 });
  }
}
