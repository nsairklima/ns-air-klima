export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function GET(
  _req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
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

    // PDF létrehozása
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = 750;
    const line = (text: string, size = 12) => {
      page.drawText(text, {
        x: 50,
        y,
        size,
        font,
        color: rgb(0, 0, 0),
      });
      y -= size + 8;
    };

    line("ÁRAJÁNLAT", 24);
    y -= 10;

    line(`Ügyfél: ${quote.client.name}`, 14);
    if (quote.client.address) line(`Cím: ${quote.client.address}`);
    if (quote.client.email) line(`Email: ${quote.client.email}`);
    if (quote.client.phone) line(`Telefon: ${quote.client.phone}`);

    y -= 10;

    line(`Dátum: ${new Date(quote.createdAt).toLocaleDateString("hu-HU")}`);
    line(`Ajánlat száma: #${quote.id}`);
    line(`Státusz: ${quote.status === 'accepted' ? 'Elfogadva' : 'Folyamatban'}`);
    y -= 10;

    line("Tételek:", 18);

    quote.items.forEach((i) => {
      line(
        `${i.name} — ${i.qty} × ${i.finalPriceNet} Ft = ${
          i.qty * i.finalPriceNet
        } Ft`
      );
    });

    y -= 10;

    line(`Nettó összesen: ${quote.netTotal} Ft`, 14);
    line(`ÁFA: ${quote.vatAmount} Ft`);
    line(`Bruttó összesen: ${quote.grossTotal} Ft`);

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=ajanlat-${quoteId}.pdf`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "PDF generálás hiba." }, { status: 500 });
  }
}
