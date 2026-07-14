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

    // SZUPER-KOMPAKT MARGÓK (A4: 595 x 842 pt). 30 pontos margóval maximalizáljuk a helyet.
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: 30, left: 35, right: 35, bottom: 30 },
      bufferPages: true,
      autoFirstPage: false 
    });
    
    const chunks: any[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.addPage();

    const fontPath = path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf");
    const fontBoldPath = path.join(process.cwd(), "public/fonts/Roboto-Bold.ttf");
    doc.font(fontPath);

    // 1. FEJLÉC SZEKCIÓ (Kétoszlopos elrendezés a helytakarékosságért)
    doc.fontSize(16).font(fontBoldPath).text("ÁRAJÁNLAT", 35, 30);
    
    doc.fontSize(8.5).font(fontPath).fillColor("#555");
    doc.text(`Ajánlat száma: #${quote.id}`, 35, 50);
    doc.text(`Dátum: ${new Date(quote.createdAt).toLocaleDateString("hu-HU")}`, 35, 62);

    // Vevő adatai a jobb oldalon, egy magasságban a fejléccel
    doc.font(fontBoldPath).fillColor("#000").text("Megrendelő:", 320, 30);
    doc.font(fontPath).text(quote.client.name, 320, 42, { width: 240 });
    doc.text(quote.client.address || "-", 320, 54, { width: 240 });

    // 2. TÁBLÁZAT FEJLÉC (Feljebb hozva y = 85-re)
    let y = 85;
    doc.rect(35, y, 525, 14).fill("#f5f5f5");
    doc.fillColor("#000").fontSize(8).font(fontBoldPath).text("Megnevezés", 42, y + 3);
    doc.text("Menny.", 310, y + 3);
    doc.text("Bruttó egységár", 385, y + 3);
    doc.text("Bruttó összesen", 475, y + 3);
    y += 18;

    // 3. TÉTELEK KIÍRÁSA (Rendkívül kompakt sorközökkel)
    doc.font(fontPath).fontSize(8).fillColor("#222");
    
    quote.items.forEach((item) => {
      // Kiszámoljuk, hogy a leírás hány soros. Ha 1 soros, a magasság minimális.
      const textHeight = doc.heightOfString(item.description, { width: 250 });
      const rowHeight = Math.max(textHeight + 4, 13); // Nagyon szűk, de jól olvasható padding

      // Ha átlépnénk a 15 tétel feletti fizikai határt (itt már lapváltás kell)
      if (y + rowHeight > 670) {
        doc.addPage();
        y = 40;
      }

      doc.text(item.description, 42, y, { width: 250 });
      doc.text(`${item.quantity} ${item.unit || "db"}`, 310, y);
      
      const unitGross = Math.round(Number(item.unitPriceNet) * 1.27);
      doc.text(`${unitGross.toLocaleString()} Ft`, 385, y);
      doc.text(`${Number(item.lineGross).toLocaleString()} Ft`, 475, y);
      
      y += rowHeight;
      
      // Halvány elválasztó vonal
      doc.strokeColor("#f0f0f0").lineWidth(0.5).moveTo(35, y - 2).lineTo(560, y - 2).stroke();
    });

    // 4. LÁBLÉC ÉS ÖSSZESÍTŐ (Fixen az 1. oldal aljára kényszerítve, ha belefér, de maximum a 2. oldalra)
    // Ha 15 tételünk van, az y kb. 350-450 között lesz, így kényelmesen elfér az alján.
    if (y > 670) {
      doc.addPage();
      y = 40;
    }

    // Összesítőt fixen lejjebb toljuk a lap alja felé, hogy ne lebegjen középen, ha kevés a tétel
    const footerStartY = Math.max(y + 15, 680); 

    // ÖSSZESÍTŐ DOBOZ (Kompaktabb méretben)
    doc.rect(340, footerStartY, 220, 22).lineWidth(1).strokeColor("#2c3e50").stroke();
    doc.font(fontBoldPath).fontSize(9).fillColor("#000").text("Fizetendő bruttó:", 348, footerStartY + 7);
    doc.fontSize(10).text(`${Number(quote.grossTotal).toLocaleString()} Ft`, 450, footerStartY + 7, { align: 'right', width: 100 });

    // KÖSZÖNJÜK + ÉRVÉNYESSÉG (Egymás mellett, egy sorban, hogy spóroljunk a hellyel!)
    let infoY = footerStartY + 30;
    doc.font(fontBoldPath).fontSize(8).fillColor("#005eb8").text("Köszönjük, hogy minket választott!", 35, infoY);
    
    doc.font(fontBoldPath).fontSize(7.5).fillColor("#444").text("Érvényesség:", 320, infoY);
    doc.font(fontPath).text("7 nap", 380, infoY);

    // HOSSZÚ JÓTÁLLÁSI / TÁJÉKOZTATÓ SZÖVEG
    infoY += 12;
    doc.font(fontPath).fontSize(7).fillColor("#666").text(
      "Árajánlatunkat az Ön igényeinek megfelelően állítottuk össze. Bízunk benne, hogy segítségére lesz a döntéshozatalban.", 
      35, 
      infoY, 
      { width: 525 }
    );

    // ALANYI ADÓMENTES MEGJEGYZÉS (Legalsó sor)
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
        "Cache-Control": "no-store, max-age=0",
      },
    });

  } catch (error) {
    console.error("PDF generálási hiba:", error);
    return NextResponse.json({ error: "Hiba történt a PDF generálása közben" }, { status: 500 });
  }
}
