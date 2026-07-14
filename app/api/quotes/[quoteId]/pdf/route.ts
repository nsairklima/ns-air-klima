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
        items: {
          orderBy: {
            sortOrder: 'asc'
          }
        } 
      },
    });

    if (!quote) return NextResponse.json({ error: "Az ajánlat nem található" }, { status: 404 });

    // SZUPER-KOMPAKT MARGÓK - Az Android nyomtatási hibák elkerülésére
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: 25, left: 35, right: 35, bottom: 45 }, // Nagyobb alsó biztonsági margó
      bufferPages: true,
      autoFirstPage: false 
    });
    
    const chunks: any[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.addPage();

    const fontPath = path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf");
    const fontBoldPath = path.join(process.cwd(), "public/fonts/Roboto-Bold.ttf");
    doc.font(fontPath);

    // 1. FEJLÉC SZEKCIÓ (Maximálisan összenyomva)
    doc.fontSize(15).font(fontBoldPath).text("ÁRAJÁNLAT", 35, 25);
    
    doc.fontSize(8).font(fontPath).fillColor("#555");
    doc.text(`Ajánlat száma: #${quote.id}`, 35, 42);
    doc.text(`Dátum: ${new Date(quote.createdAt).toLocaleDateString("hu-HU")}`, 35, 52);

    // Vevő adatai jobb oldalon (szorosan a fejléccel egy magasságban)
    doc.font(fontBoldPath).fillColor("#000").text("Megrendelő:", 320, 25);
    doc.font(fontPath).text(quote.client.name, 320, 37, { width: 240 });
    doc.text(quote.client.address || "-", 320, 47, { width: 240 });

    // 2. TÁBLÁZAT FEJLÉC (Feljebb hozva y = 75-re)
    let y = 75;
    doc.rect(35, y, 525, 14).fill("#f5f5f5");
    doc.fillColor("#000").fontSize(8).font(fontBoldPath).text("Megnevezés", 42, y + 3);
    doc.text("Menny.", 310, y + 3);
    doc.text("Bruttó egységár", 385, y + 3);
    doc.text("Bruttó összesen", 475, y + 3);
    y += 18;

    // 3. TÉTELEK KIÍRÁSA (Rendkívül szűk sorközzel az 1 oldalas limit miatt)
    doc.font(fontPath).fontSize(8).fillColor("#222");
    
    quote.items.forEach((item) => {
      const textHeight = doc.heightOfString(item.description, { width: 250 });
      const rowHeight = Math.max(textHeight + 3, 12); // Extra szűk padding

      // ANDROID LIMIT: Ha átlépjük a 600-as Y-t, kényszerítünk egy új oldalt, 
      // mert az Android efelett már le fogja vágni vagy elcsúsztatja a láblécet!
      if (y + rowHeight > 600) {
        doc.addPage();
        y = 35;
      }

      doc.text(item.description, 42, y, { width: 250 });
      doc.text(`${item.quantity} ${item.unit || "db"}`, 310, y);
      
      const unitGross = Math.round(Number(item.unitPriceNet) * 1.27);
      doc.text(`${unitGross.toLocaleString()} Ft`, 385, y);
      doc.text(`${Number(item.lineGross).toLocaleString()} Ft`, 475, y);
      
      y += rowHeight;
      doc.strokeColor("#f0f0f0").lineWidth(0.5).moveTo(35, y - 1).lineTo(560, y - 1).stroke();
    });

    // 4. ANDROID-BIZTOS LÁBLÉC ELRENDEZÉS
    // Ha a tételek után túl közel lennénk a kritikus zónához, menjen inkább a 2. oldalra az egész lábléc
    if (y > 600) {
      doc.addPage();
      y = 35;
    }

    // A lábléc kezdetét fixen feljebb hozzuk (640-re az eddigi 680 helyett), 
    // így az Android beépített alsó margója nem tud beleérni az utolsó sorba.
    const footerStartY = Math.max(y + 12, 640); 

    // Összesítő doboz (Még laposabb, még kompaktabb)
    doc.rect(340, footerStartY, 220, 20).lineWidth(1).strokeColor("#2c3e50").stroke();
    doc.font(fontBoldPath).fontSize(8.5).fillColor("#000").text("Fizetendő bruttó:", 348, footerStartY + 6);
    doc.fontSize(9.5).text(`${Number(quote.grossTotal).toLocaleString()} Ft`, 450, footerStartY + 6, { align: 'right', width: 100 });

    // Információs sorok összevonva, hogy ne nyúljanak le mélyre
    let infoY = footerStartY + 26;
    doc.font(fontBoldPath).fontSize(8).fillColor("#005eb8").text("Köszönjük, hogy minket választott!", 35, infoY);
    
    doc.font(fontBoldPath).fontSize(7.5).fillColor("#444").text("Érvényesség:", 320, infoY);
    doc.font(fontPath).text("7 nap", 380, infoY);

    infoY += 12;
    doc.font(fontPath).fontSize(7).fillColor("#666").text(
      "Árajánlatunkat az Ön igényeinek megfelelően állítottuk össze. Bízunk benne, hogy segítségére lesz a döntéshozatalban.", 
      35, 
      infoY, 
      { width: 525 }
    );

    // AZ UTOLSÓ SOR (Most már jóval az Android kritikus vágási zónája felett van)
    infoY += 14;
    doc.strokeColor("#eee").lineWidth(0.5).moveTo(35, infoY - 3).lineTo(560, infoY - 3).stroke();
    doc.font(fontBoldPath).fontSize(7).fillColor("#444").text("Megjegyzés: ", 35, infoY, { continued: true });
    doc.font(fontPath).text("Az ajánlat készítője alanyi adómentes, ezért a végösszeget az Áfa mértéke nem befolyásolja.");

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
