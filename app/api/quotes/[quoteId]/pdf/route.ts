import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";
import { NextResponse } from "next/server";
import { Readable } from "stream";

// PDF generálás – /api/quotes/:quoteId/pdf
export async function GET(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: Number(params.quoteId) },
      include: {
        client: true,
        items: true
      }
    });

    if (!quote) {
      return NextResponse.json({ error: "Ajánlat nem található." }, { status: 404 });
    }

    // === PDF GENERÁLÁS ===

    const doc = new PDFDocument({
      size: "A4",
      margin: 40
    });

    const stream = new Readable({
      read() {}
    });

    doc.pipe(stream);

    // ----- CÉGADATOK FEJLÉC -----
    doc
      .image("public/logo.png", 40, 40, { width: 120 })
      .fontSize(20)
      .text("NS-AIR KLÍMA", 200, 45)
      .fontSize(10)
      .text("Cím: ...", 200, 70)
      .text("Telefon: ...", 200, 85)
      .text("E-mail: ...", 200, 100)
      .moveDown();

    doc.moveDown();

    // ----- ÜGYFÉL ADATOK -----
    doc
      .fontSize(14)
      .text("Ügyfél adatai", { underline: true })
      .moveDown(0.5);

    doc.fontSize(11);
    doc.text(`Név: ${quote.client.name}`);
    if (quote.client.address) doc.text(`Cím: ${quote.client.address}`);
    if (quote.client.phone) doc.text(`Telefon: ${quote.client.phone}`);
    if (quote.client.email) doc.text(`Email: ${quote.client.email}`);

    doc.moveDown();

    // ----- AJÁNLAT ADATOK -----
    doc
      .fontSize(14)
      .text("Ajánlat adatai", { underline: true })
      .moveDown(0.5);

    doc.fontSize(11).text(`Ajánlatszám: ${quote.quoteNo}`);
    doc.text(`Dátum: ${quote.dateIssued.toISOString().substring(0, 10)}`);
    doc.text(`Státusz: ${quote.status}`);

    doc.moveDown();

    // ----- TÉTELSOROK TÁBLÁZAT -----
    doc
      .fontSize(14)
      .text("Tételsorok", { underline: true })
      .moveDown(0.5);

    quote.items.forEach((item) => {
      doc
        .fontSize(11)
        .text(`${item.name} — ${item.finalPriceNet} Ft x ${item.qty}`, {
          indent: 10
        });
    });

    doc.moveDown();

    // ----- ÖSSZESÍTÉS -----
    doc
      .fontSize(14)
      .text("Összegzés", { underline: true })
      .moveDown(0.5);

    doc.fontSize(11);
    if (quote.netTotal) doc.text(`Nettó összeg: ${quote.netTotal} Ft`);
    if (quote.vatAmount) doc.text(`ÁFA: ${quote.vatAmount} Ft`);
    if (quote.grossTotal) doc.text(`Bruttó végösszeg: ${quote.grossTotal} Ft`);

    doc.moveDown();

    // ----- FIZETÉSI FELTÉTELEK -----
    if (quote.terms) {
      doc
        .fontSize(14)
        .text("Fizetési feltételek", { underline: true })
        .moveDown(0.5);

      doc.fontSize(11).text(quote.terms, {
        indent: 10
      });
      doc.moveDown();
    }

    // ----- ALÁÍRÁS / PECSÉT -----
    doc.moveDown(2);
    doc.fontSize(12).text("_____________________________", 40);
    doc.text("Aláírás / Pecsét", 40);

    // lezárás
    doc.end();

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="ajanlat-${quote.quoteNo}.pdf"`
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Hiba a PDF generálásakor." },
      { status: 500 }
    );
  }
}
