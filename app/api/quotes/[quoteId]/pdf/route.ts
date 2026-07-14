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
        items: {
          orderBy: {
            sortOrder: 'asc'
          }
        } 
      },
    });

    if (!quote) return NextResponse.json({ error: "Az ajánlat nem található" }, { status: 404 });

    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: 35, left: 40, right: 40, bottom: 35 },
      bufferPages: true,
      autoFirstPage: false 
    });
    
    const chunks: any[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.addPage();

    const fontPath = path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf");
    const fontBoldPath = path.join(process.cwd(), "public/fonts/Roboto-Bold.ttf");
    doc.font(fontPath);

    // FEJLÉC
    doc.fontSize(20).font(fontBoldPath).text("ÁRAJÁNLAT", { align: "center" });
    let y = 65; 

    // ADATOK
    doc.fontSize(10).font(fontPath).text(`Dátum: ${new Date(quote.createdAt).toLocaleDateString("hu-HU")}`, 50, y);
    y += 14;
    doc.text(`Ajánlat száma: #${quote.id}`, 50, y);
    y += 22;

    doc.fontSize(11).font(fontBoldPath).text("Ügyfél adatai:", 50, y);
    doc.font(fontPath).fontSize(10);
    y += 14;
    doc.text(`${quote.client.name}`, 50, y);
    y += 12;
    doc.text(`${quote.client.address || "-"}`, 50, y);
    y += 25;

    // TÁBLÁZAT FEJLÉC
    doc.rect(50, y, 500, 18).fill("#f0f0f0");
    doc.fillColor("#000").fontSize(9).font(fontBoldPath).text("Megnevezés", 60, y + 5);
    doc.text("Menny.", 300, y + 5);
    doc.text("Bruttó egységár", 380, y + 5);
    doc.text("Bruttó összesen", 465, y + 5);
    y += 22;

    // TÉTELEK KIÍRÁSA
    doc.font(fontPath).fillColor("#000");
    quote.items.forEach((item) => {
      const textHeight = doc.heightOfString(item.description, { width: 230 });
      const rowHeight = Math.max(textHeight + 8, 18);

      // Ha a tétel már nem férne el a lapon (A4 magasság ~842, 740 fölé nem megyünk)
      if (y + rowHeight > 740) {
        doc.addPage();
        y = 50;
      }

      doc.fontSize(9).text(item.description, 60, y, { width: 230 });
      doc.text(`${item.quantity} ${item.unit || "db"}`, 300, y);
      
      const unitGross = Math.round(Number(item.unitPriceNet) * 1.27);
      doc.text(`${unitGross.toLocaleString()} Ft`, 380, y);
      doc.text(`${Number(item.lineGross).toLocaleString()} Ft`, 465, y);
      
      y += rowHeight;
      
      doc.strokeColor("#eee").lineWidth(0.5).moveTo(50, y - 3).lineTo(550, y - 3).stroke();
    });

    // LÁBLÉC ÉS ÖSSZESÍTŐ RAJZOLÓ FÜGGVÉNY
    const renderFooter = (startY: number) => {
      let currentY = startY + 15;
      
      // ÖSSZESÍTŐ BLOKK
      doc.rect(340, currentY, 210, 26).lineWidth(1).strokeColor("#2c3e50").stroke();
      doc.font(fontBoldPath).fontSize(10).fillColor("#000").text("Fizetendő bruttó:", 350, currentY + 8);
      doc.fontSize(11).text(`${Number(quote.grossTotal).toLocaleString()} Ft`, 450, currentY + 8, { align: 'right', width: 90 });

      // LÁBLÉC SZÖVEGEK
      currentY += 40;
      doc.font(fontPath).fontSize(9).fillColor("#005eb8").text("Köszönjük, hogy minket választott!", 50, currentY);
      
      currentY += 15;
      doc.fillColor("#444").fontSize(8).text("Árajánlatunkat az Ön igényeinek megfelelően állítottuk össze. Bízunk benne, hogy segítségére lesz a döntéshozatalban.", 50, currentY, { width: 500 });
      
      currentY += 16;
      doc.font(fontBoldPath).text("Érvényesség:", 50, currentY);
      doc.font(fontPath).text("7 nap", 110, currentY);
      
      // MEGJEGYZÉS BLOKK
      currentY += 20;
      doc.strokeColor("#eee").lineWidth(0.5).moveTo(50, currentY - 5).lineTo(550, currentY - 5).stroke();
      doc.font(fontBoldPath).fontSize(8).fillColor("#444").text("Megjegyzés: ", 50, currentY, { continued: true });
      doc.font(fontPath).text("Az ajánlat készítője alanyi adómentes, ezért a végösszeget az Áfa mértéke nem befolyásolja.");
    };

    // FŐ LOGIKA: Elég hely van az aktuális oldalon a teljes láblécnek? (Körülbelül 180 pont kell neki)
    // Az A4 magassága 842 pont, így ha y > 640, akkor már nincs elég biztonságos helyünk.
    if (y > 640) {
      doc.addPage();
      renderFooter(40); // Ha új oldalra kényszerül, a lap tetejétől indítjuk az egészet
    } else {
      renderFooter(y);   // Ha befér, közvetlenül a tételek alá rajzoljuk
    }

    doc.end();

    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=ajanlat_${quote.id}.pdf`,
        "Cache-Control": "no-store, max-age=0",
      },
    });

  } catch (error) {
    console.error("PDF generálási hiba:", error);
    return NextResponse.json({ error: "Hiba történt a PDF generálása közben" }, { status: 500 });
  }
}
