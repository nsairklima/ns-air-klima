import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

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

    // FONT BETÖLTÉSE A PROJEKTBŐL
    const fontPath = path.join(
      process.cwd(),
      "app/api/quotes/[quoteId]/pdf/fonts/NotoSans-Regular.ttf"
    );
    const fontBuffer = fs.readFileSync(fontPath);

    const doc = new PDFDocument({ margin: 40 });
    const chunks: Buffer[] = [];

    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => {});

    // FONT BEÁLLÍTÁSA
    doc.font(fontBuffer);

    // CÍM
    doc.fontSize(22).text("ÁRAJÁNLAT", { align: "center" });
    doc.moveDown();

    // Ügyfél
    doc.fontSize(12).text(`Ügyfél: ${quote.client.name}`);
    if (quote.client.address) doc.text(`Cím: ${quote.client.address}`);
    if (quote.client.email) doc.text(`Email: ${quote.client.email}`);
    if (quote.client.phone) doc.text(`Telefon: ${quote.client.phone}`);

    doc.moveDown();
    doc.text(`Ajánlat száma: ${quote.quoteNo}`);
    doc.text(`Státusz: ${quote.status}`);
    doc.moveDown();

    // Tételek
    doc.fontSize(14).text("Tételek:", { underline: true });
    doc.moveDown(0.5);

    quote.items.forEach((item) => {
      doc
        .fontSize(12)
        .text(
          `${item.name} — ${item.qty} × ${item.finalPriceNet} Ft = ${
            item.qty * item.finalPriceNet
          } Ft`
        );
    });

    doc.moveDown();
    doc.fontSize(14).text(`Nettó összesen: ${quote.netTotal} Ft`);
    doc.text(`ÁFA: ${quote.vatAmount} Ft`);
    doc.text(`Bruttó: ${quote.grossTotal} Ft`);

    doc.end();

    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      const final = Buffer.concat(chunks);
      resolve(final);
    });

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=ajanlat-${quoteId}.pdf`,
      },
    });
  } catch (error) {
    console.error("PDF generálás hiba:", error);
    return NextResponse.json({ error: "PDF generálás hiba." }, { status: 500 });
  }
}
