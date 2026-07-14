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
    
    // Lekérjük az ajánlatot a kifejezett sorrenddel
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: { 
        client: true, 
        items: {
          orderBy: {
            sortOrder: 'asc' // Ez biztosítja, hogy a PDF-ben is a mentett sorrend legyen
          }
        } 
      },
    });

    if (!quote) return NextResponse.json({ error: "Az ajánlat nem található" }, { status: 404 });

    // PDF létrehozása standard A4 méretben
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: 40, left: 40, right: 40, bottom: 40 },
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
    let y = 70; 

    // ADATOK
    doc.fontSize(10).font(fontPath).text(`Dátum: ${new Date(quote.createdAt).toLocaleDateString("hu-HU")}`, 50, y);
    y += 15;
    doc.text(`Ajánlat száma: #${quote.id}`, 50, y);
    y += 25;

    doc.fontSize(11).font(fontBoldPath).text("Ügyfél adatai:", 50, y);
    doc.font(fontPath).fontSize(10);
    y += 15;
    doc.text(`${quote.client.name}`, 50, y);
    y += 12;
    doc.text(`${quote.client.address || "-"}`, 50, y);
    y += 30;

    // TÁBLÁZAT FEJLÉC
    doc.rect(50, y, 500, 18).fill("#f0f0f0");
    doc.fillColor("#000").fontSize(9).font(fontBoldPath).text("Megnevezés", 60, y + 5);
    doc.text("Menny.", 300, y + 5);
    doc.text("Bruttó egységár", 380, y + 5);
    doc.text("Bruttó összesen", 465, y + 5);
    y += 25;

    // TÉTELEK KIÍRÁSA
    doc.font(fontPath).fillColor("#000");
    quote.items.forEach((item) => {
      const textHeight = doc.heightOfString(item.description, { width: 230 });
      const rowHeight = Math.max(textHeight + 10, 20);

      // Biztonságos ellenőrzés: ha az aktuális y + a sor magassága túl közel van a lap aljához (700 pont), új oldalra rakjuk
      if (y + rowHeight > 700) {
        doc.addPage();
        y = 50;
      }

      doc.fontSize(9).text(item.description, 60, y, { width: 230 });
      doc.text(`${item.quantity} ${item.unit || "db"}`, 300, y);
      
      // Egységár kalkuláció
      const unitGross = Math.round(Number(item.unitPriceNet) * 1.27);
      doc.text(`${unitGross.toLocaleString()} Ft`, 380, y);
      doc.text(`${Number(item.lineGross).toLocaleString()} Ft`, 465, y);
      
      y += rowHeight;
      
      // Elválasztó vonal
      doc.strokeColor("#eee").lineWidth(0.5).moveTo(50, y - 5).lineTo(550, y - 5).stroke();
    });

    // ÖSSZESÍTŐ ÉS LÁBLÉC BLOKK HELYELLENŐRZÉSE
    // Az összesítőnek és a láblécnek összesen kb. 120-130 pont hely kell. 
    // Ha y > 630, akkor inkább áttesszük egy tiszta új oldalra, hogy biztosan ne lógjon le az alsó sor.
    if (y > 630) { 
      doc.addPage(); 
      y = 50; 
    }

    // ÖSSZESÍTŐ BLOKK
    y += 15;
    doc.rect(340, y, 210, 30).lineWidth(1).strokeColor("#2c3e50").stroke();
    doc.font(fontBoldPath).fontSize(11).text("Fizetendő bruttó:", 350, y + 10);
    doc.fontSize(12).text(`${Number(quote.grossTotal).toLocaleString()} Ft`, 450, y + 10, { align: 'right', width: 90 });

    // LÁBLÉC INFORMÁCIÓK
    y += 45;
    doc.font(fontPath).fontSize(9).fillColor("#005eb8").text("Köszönjük bizalmát!", 50, y);
    y += 15;
    doc.fillColor("#444").fontSize(8).text("Az ajánlat 7 napig érvényes.", 50, y);
    y += 12;
    doc.text("Készítette: Klíma Kezelő Rendszer", 50, y);

    doc.end();

    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    // Válasz küldése PDF-ként, cache letiltással
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
