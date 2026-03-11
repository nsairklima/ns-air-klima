import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";
import { NextResponse } from "next/server";

// GET /api/quotes/:quoteId/pdf
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

    // PDF → Buffer
    const doc = new PDFDocument();
    const chunks: Uint8Array[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {});

    // --- PDF TARTALOM ---
    doc.fontSize(20).text("NS-AIR KLÍMA AJÁNLAT", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Ajánlatszám: ${quote.quoteNo}`);
    doc.text(`Dátum: ${quote.dateIssued.toISOString().substring(0, 10)}`);
    doc.moveDown();

    doc.fontSize(16).text("Ügyfél adatok", { underline: true });
    doc.fontSize(12);
    doc.text(`Név: ${quote.client.name}`);
    if (quote.client.address) doc.text(`Cím: ${quote.client.address}`);
    if (quote.client.phone) doc.text(`Telefon: ${quote.client.phone}`);
    if (quote.client.email) doc.text(`Email: ${quote.client.email}`);
    doc.moveDown();

    doc.fontSize(16).text("Tételek", { underline: true });
    doc.fontSize(12);
    quote.items.forEach((item) => {
      doc.text(`${item.name} – ${item.finalPriceNet} Ft x ${item.qty}`);
    });

    doc.moveDown();

    doc.fontSize(16).text("Végösszeg", { underline: true });
    doc.fontSize(12);

    if (quote.netTotal) doc.text(`Nettó: ${quote.netTotal} Ft`);
    if (quote.vatAmount) doc.text(`ÁFA: ${quote.vatAmount} Ft`);
    if (quote.grossTotal) doc.text(`Bruttó: ${quote.grossTotal} Ft`);

    doc.end();

    // Buffer létrehozása
    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="ajanlat-${quote.quoteNo}.pdf"`
      }
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "PDF generálás hiba." },
      { status: 500 }
    );
  }
}
