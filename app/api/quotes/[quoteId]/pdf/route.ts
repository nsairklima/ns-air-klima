export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";
import path from "path";

export async function GET(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const id = Number(params.quoteId);
    
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: { 
        client: true, 
        items: { orderBy: { sortOrder: 'asc' } } 
      },
    });

    if (!quote) return NextResponse.json({ error: "Az ajánlat nem található" }, { status: 404 });

    // Hagyományos inicializálás, fixen 1 oldalas keret
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: 25, left: 35, right: 35, bottom: 35 }
    });
    
    const chunks: any[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));

    const fontPath = path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf");
    const fontBoldPath = path.join(process.cwd(), "public/fonts/Roboto-Bold.ttf");
    doc.font(fontPath);

    // Fejléc
    doc.fontSize(14).font(fontBoldPath).text("BRUTTÓ ÁRAJÁNLAT", 35, 25);
    doc.fontSize(8).font(fontPath).fillColor("#555");
    doc.text(`Sorszám: #${quote.id}  |  Dátum: ${new Date(quote.createdAt).toLocaleDateString("hu-HU")}`, 35, 42);

    // Vevő
    doc.font(fontBoldPath).fillColor("#000").text("Megrendelő:", 320, 25);
    doc.font(fontPath).text(`${quote.client.name} (${quote.client.address || "-"})`, 320, 37, { width: 240 });

    // Táblázat fejléc
    let y = 65;
    doc.rect(35, y, 525, 12).fill("#eef2f5");
    doc.fillColor("#000").fontSize(7.5).font(fontBoldPath).text("Megnevezés", 42, y + 2.5);
    doc.text("Menny.", 310, y + 2.5);
    doc.text("Egységár", 385, y + 2.5);
    doc.text("Összesen", 475, y + 2.5);
    y += 15;

    // Tételek listázása - NINCS OLDALVÁLTÁS MEGENGEDVE
    doc.font(fontPath).fontSize(7.5).fillColor("#222");
    
    quote.items.forEach((item) => {
      const textHeight = doc.heightOfString(item.description, { width: 250 });
      const rowHeight = Math.max(textHeight + 2, 11);

      doc.text(item.description, 42, y, { width: 250 });
      doc.text(`${item.quantity} ${item.unit || "db"}`, 310, y);
      
      const unitGross = Math.round(Number(item.unitPriceNet) * 1.27);
      doc.text(`${unitGross.toLocaleString()} Ft`, 385, y);
      doc.text(`${Number(item.lineGross).toLocaleString()} Ft`, 475, y);
      
      y += rowHeight;
      doc.strokeColor("#f5f5f5").lineWidth(0.5).moveTo(35, y - 1).lineTo(560, y - 1).stroke();
    });

    // Dinamikus lábléc pozíció - közvetlenül a tételek alatt fut le, nem fixen az alján!
    let footerStartY = y + 15; 

    // Elválasztó vonal
    doc.strokeColor("#2c3e50").lineWidth(1).moveTo(35, footerStartY).lineTo(560, footerStartY).stroke();

    // Szövegek és összesítő egy magasságban
    let infoY = footerStartY + 10;
    
    doc.font(fontBoldPath).fontSize(8).fillColor("#005eb8").text("Köszönjük a megkeresést!", 35, infoY);
    doc.font(fontPath).fontSize(7).fillColor("#555");
    doc.text("Az ajánlatunk 7 napig érvényes.", 35, infoY + 12);
    doc.font(fontBoldPath).text("Megjegyzés: ", 35, infoY + 24, { continued: true });
    doc.font(fontPath).text("Alanyi adómentes értékesítés, a végösszeget ÁFA nem terheli.");

    // Összesítő doboz jobbra
    doc.rect(340, infoY, 220, 20).fill("#2c3e50");
    doc.font(fontBoldPath).fontSize(8).fillColor("#fff").text("Fizetendő bruttó végösszeg:", 348, infoY + 6);
    doc.fontSize(9).text(`${Number(quote.grossTotal).toLocaleString()} Ft`, 450, infoY + 6, { align: 'right', width: 100 });

    doc.end();

    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=ajanlat_${quote.id}.pdf`,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });

  } catch (error) {
    console.error("PDF generálási hiba:", error);
    return NextResponse.json({ error: "Hiba történt a PDF generálása közben" }, { status: 500 });
  }
}
