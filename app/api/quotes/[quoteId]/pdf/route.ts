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

    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: 30, left: 35, right: 35, bottom: 60 },
      bufferPages: true,
      autoFirstPage: false 
    });
    
    const chunks: any[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.addPage();

    const fontPath = path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf");
    const fontBoldPath = path.join(process.cwd(), "public/fonts/Roboto-Bold.ttf");
    doc.font(fontPath);

    // Fejléc
    doc.fontSize(14).font(fontBoldPath).text("BRUTTÓ ÁRAJÁNLAT", 35, 30);
    doc.fontSize(8).font(fontPath).fillColor("#555");
    doc.text(`Sorszám: #${quote.id}  |  Dátum: ${new Date(quote.createdAt).toLocaleDateString("hu-HU")}`, 35, 47);

    // Vevő
    doc.font(fontBoldPath).fillColor("#000").text("Megrendelő:", 320, 30);
    doc.font(fontPath).text(`${quote.client.name} (${quote.client.address || "-"})`, 320, 42, { width: 240 });

    // Táblázat
    let y = 75;
    doc.rect(35, y, 525, 14).fill("#eef2f5");
    doc.fillColor("#000").fontSize(8).font(fontBoldPath).text("Megnevezés", 42, y + 3);
    doc.text("Menny.", 310, y + 3);
    doc.text("Egységár", 385, y + 3);
    doc.text("Összesen", 475, y + 3);
    y += 18;

    doc.font(fontPath).fontSize(8).fillColor("#222");
    
    quote.items.forEach((item) => {
      if (y > 420) {
        doc.addPage();
        y = 40;
      }

      const textHeight = doc.heightOfString(item.description, { width: 250 });
      const rowHeight = Math.max(textHeight + 4, 14);

      doc.text(item.description, 42, y, { width: 250 });
      doc.text(`${item.quantity} ${item.unit || "db"}`, 310, y);
      
      const unitGross = Math.round(Number(item.unitPriceNet) * 1.27);
      doc.text(`${unitGross.toLocaleString()} Ft`, 385, y);
      doc.text(`${Number(item.lineGross).toLocaleString()} Ft`, 475, y);
      
      y += rowHeight;
      doc.strokeColor("#e0e0e0").lineWidth(0.5).moveTo(35, y - 2).lineTo(560, y - 2).stroke();
    });

    if (y > 400) {
      doc.addPage();
      y = 40;
    }

    const footerStartY = Math.max(y + 20, 450); 

    doc.strokeColor("#2c3e50").lineWidth(1).moveTo(35, footerStartY).lineTo(560, footerStartY).stroke();

    let infoY = footerStartY + 15;
    doc.font(fontBoldPath).fontSize(8.5).fillColor("#005eb8").text("Köszönjük a megkeresést!", 35, infoY);
    doc.font(fontPath).fontSize(7.5).fillColor("#555");
    doc.text("Az ajánlatunk 7 napig érvényes.", 35, infoY + 14);
    doc.font(fontBoldPath).text("Megjegyzés: ", 35, infoY + 28, { continued: true });
    doc.font(fontPath).text("Alanyi adómentes értékesítés, a végösszeget ÁFA nem terheli.");

    doc.rect(340, infoY, 220, 24).fill("#2c3e50");
    doc.font(fontBoldPath).fontSize(8.5).fillColor("#fff").text("Fizetendő bruttó végösszeg:", 348, infoY + 8);
    doc.fontSize(9.5).text(`${Number(quote.grossTotal).toLocaleString()} Ft`, 450, infoY + 8, { align: 'right', width: 100 });

    doc.end();

    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        // KIKÉNYSZERÍTETT LETÖLTÉS (Már nem a böngésző rendereli, így nem tud elcsúszni)
        "Content-Disposition": `attachment; filename=ajanlat_${quote.id}.pdf`,
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
