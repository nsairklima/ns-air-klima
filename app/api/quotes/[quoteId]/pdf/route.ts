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

    const itemCount = quote.items.length;

    // --- DINAMIKUS SKÁLÁZÁSI LOGIKA (Garantáltan 1 oldalas PDF) ---
    // Ha sok a tétel, visszavesszük a betűméreteket és a sormagasságokat, hogy ne csússzon át a 2. oldalra.
    const isCrowded = itemCount > 5;
    const isVeryCrowded = itemCount > 10;

    const baseFontSize = isVeryCrowded ? 8 : (isCrowded ? 9 : 10);
    const titleFontSize = isVeryCrowded ? 16 : (isCrowded ? 18 : 20);
    const tableHeaderFontSize = isVeryCrowded ? 8 : 9;
    const itemFontSize = isVeryCrowded ? 7.5 : (isCrowded ? 8.5 : 9);
    
    const lineSpacing = isVeryCrowded ? 10 : (isCrowded ? 14 : 18); // Távolság a tételek között
    const paddingMultiplier = isVeryCrowded ? 0.7 : (isCrowded ? 0.85 : 1);

    // Margók csökkentése, ha sok a tétel, hogy több legyen a hasznos hely függőlegesen
    const topMargin = isVeryCrowded ? 20 : 30;
    const bottomMargin = isVeryCrowded ? 20 : 30;

    // PDF létrehozása
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: topMargin, left: 40, right: 40, bottom: bottomMargin },
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
    doc.fontSize(titleFontSize).font(fontBoldPath).text("ÁRAJÁNLAT", { align: "center" });
    let y = isVeryCrowded ? 45 : 60; 

    // ADATOK
    doc.fontSize(baseFontSize).font(fontPath).text(`Dátum: ${new Date(quote.createdAt).toLocaleDateString("hu-HU")}`, 50, y);
    y += isVeryCrowded ? 12 : 15;
    doc.text(`Ajánlat száma: #${quote.id}`, 50, y);
    y += isVeryCrowded ? 18 : 25;

    doc.fontSize(baseFontSize + 1).font(fontBoldPath).text("Ügyfél adatai:", 50, y);
    doc.font(fontPath).fontSize(baseFontSize);
    y += isVeryCrowded ? 12 : 15;
    doc.text(`${quote.client.name}`, 50, y);
    y += isVeryCrowded ? 10 : 12;
    doc.text(`${quote.client.address || "-"}`, 50, y);
    y += isVeryCrowded ? 18 : 30;

    // TÁBLÁZAT FEJLÉC
    const headerHeight = isVeryCrowded ? 14 : 18;
    doc.rect(50, y, 500, headerHeight).fill("#f0f0f0");
    doc.fillColor("#000").fontSize(tableHeaderFontSize).font(fontBoldPath).text("Megnevezés", 60, y + (isVeryCrowded ? 3 : 5));
    doc.text("Menny.", 300, y + (isVeryCrowded ? 3 : 5));
    doc.text("Bruttó egységár", 380, y + (isVeryCrowded ? 3 : 5));
    doc.text("Bruttó összesen", 465, y + (isVeryCrowded ? 3 : 5));
    y += headerHeight + (isVeryCrowded ? 5 : 10);

    // TÉTELEK KIÍRÁSA
    doc.font(fontPath).fillColor("#000");
    quote.items.forEach((item) => {
      // Dinamikus sormagasság és szövegmagasság kalkuláció
      doc.fontSize(itemFontSize);
      const textHeight = doc.heightOfString(item.description, { width: 230 });
      
      // Megnézzük, elfér-e még a tétel, vagy új oldal kell (csak ha nagyon muszáj)
      const safetyLimit = isVeryCrowded ? 780 : 700;
      if (y > safetyLimit) {
        doc.addPage();
        y = isVeryCrowded ? 30 : 50;
      }

      doc.text(item.description, 60, y, { width: 230 });
      doc.text(`${item.quantity} ${item.unit || "db"}`, 300, y);
      
      // Egységár kalkuláció
      const unitGross = Math.round(Number(item.unitPriceNet) * 1.27);
      doc.text(`${unitGross.toLocaleString()} Ft`, 380, y);
      doc.text(`${Number(item.lineGross).toLocaleString()} Ft`, 465, y);
      
      y += Math.max(textHeight + (isVeryCrowded ? 4 : 6), lineSpacing);
      
      // Elválasztó vonal
      doc.strokeColor("#eee").lineWidth(0.5).moveTo(50, y - (isVeryCrowded ? 2 : 4)).lineTo(550, y - (isVeryCrowded ? 2 : 4)).stroke();
    });

    // ÖSSZESÍTŐ BLOKK
    y += isVeryCrowded ? 10 : 15;
    
    // Biztosítjuk, hogy az összesítő is ráférjen
    if (y > (isVeryCrowded ? 790 : 720)) { 
      doc.addPage(); 
      y = isVeryCrowded ? 30 : 50; 
    }

    const totalBoxHeight = isVeryCrowded ? 22 : 30;
    const totalBoxPadding = isVeryCrowded ? 6 : 10;
    
    doc.rect(340, y, 210, totalBoxHeight).lineWidth(1).strokeColor("#2c3e50").stroke();
    doc.font(fontBoldPath).fontSize(baseFontSize + 1).text("Fizetendő bruttó:", 350, y + totalBoxPadding);
    doc.fontSize(baseFontSize + 2).text(`${Number(quote.grossTotal).toLocaleString()} Ft`, 450, y + totalBoxPadding, { align: 'right', width: 90 });

    // LÁBLÉC INFORMÁCIÓK
    y += totalBoxHeight + (isVeryCrowded ? 15 : 30);
    doc.font(fontPath).fontSize(baseFontSize).fillColor("#005eb8").text("Köszönjük bizalmát!", 50, y);
    y += isVeryCrowded ? 10 : 15;
    doc.fillColor("#444").fontSize(baseFontSize - 1).text("Az ajánlat 7 napig érvényes.", 50, y);
    y += isVeryCrowded ? 8 : 12;
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
