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

    // Drasztikus margók: 40 pont helyet hagyunk alul szabadon, és feljebb húzzuk a korlátot
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: 25, left: 35, right: 35, bottom: 50 },
      bufferPages: true,
      autoFirstPage: false 
    });
    
    const chunks: any[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.addPage();

    const fontPath = path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf");
    const fontBoldPath = path.join(process.cwd(), "public/fonts/Roboto-Bold.ttf");
    doc.font(fontPath);

    // Kétoszlopos fejléc
    doc.fontSize(14).font(fontBoldPath).text("BRUTTÓ ÁRAJÁNLAT", 35, 25);
    doc.fontSize(8).font(fontPath).fillColor("#555");
    doc.text(`Sorszám: #${quote.id}  |  Dátum: ${new Date(quote.createdAt).toLocaleDateString("hu-HU")}`, 35, 42);

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

    // Tételek listázása - Ultra-kompakt méret
    doc.font(fontPath).fontSize(7.5).fillColor("#222");
    
    quote.items.forEach((item) => {
      const textHeight = doc.heightOfString(item.description, { width: 250 });
      const rowHeight = Math.max(textHeight + 2, 11);

      // Szigorú Android limit: Ha átlépjük az 540-es magasságot, új oldalra dobja a tételeket!
      if (y + rowHeight > 540) {
        doc.addPage();
        y = 35;
      }

      doc.text(item.description, 42, y, { width: 250 });
      doc.text(`${item.quantity} ${item.unit || "db"}`, 310, y);
      
      const unitGross = Math.round(Number(item.unitPriceNet) * 1.27);
      doc.text(`${unitGross.toLocaleString()} Ft`, 385, y);
      doc.text(`${Number(item.lineGross).toLocaleString()} Ft`, 475, y);
      
      y += rowHeight;
      doc.strokeColor("#f5f5f5").lineWidth(0.5).moveTo(35, y - 1).lineTo(560, y - 1).stroke();
    });

    // Ha a tételek után nagyon közel vagyunk a limithez, a lábléc kapjon tiszta új lapot
    if (y > 540) {
      doc.addPage();
      y = 35;
    }

    // A lábléc teteje maximum 560-ról indul (így marad alul 280+ pont üres tér az Androidnak)
    const footerStartY = Math.max(y + 15, 550); 

    // Vastag elválasztó vonal a lábléc előtt
    doc.strokeColor("#2c3e50").lineWidth(1).moveTo(35, footerStartY).lineTo(560, footerStartY).stroke();

    // BAL OLDAL: Köszönet és megjegyzések összevonva egyetlen blokkba
    let infoY = footerStartY + 10;
    doc.font(fontBoldPath).fontSize(8).fillColor("#005eb8").text("Köszönjük a megkeresést!", 35, infoY);
    
    doc.font(fontPath).fontSize(7).fillColor("#555");
    doc.text("Az ajánlatunk 7 napig érvényes.", 35, infoY + 12);
    
    // Az alanyi adómentes szöveg biztonságos helyen, bal oldalon
    doc.font(fontBoldPath).text("Megjegyzés: ", 35, infoY + 24, { continued: true });
    doc.font(fontPath).text("Alanyi adómentes értékesítés, a végösszeget ÁFA nem terheli.");

    // JOBB OLDAL: Összesítő doboz (ugyanabban a magasságban, mint a szövegek!)
    doc.rect(340, infoY, 220, 22).fill("#2c3e50");
    doc.font(fontBoldPath).fontSize(8.5).fillColor("#fff").text("Fizetendő bruttó végösszeg:", 348, infoY + 7);
    doc.fontSize(9.5).text(`${Number(quote.grossTotal).toLocaleString()} Ft`, 450, infoY + 7, { align: 'right', width: 100 });

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
