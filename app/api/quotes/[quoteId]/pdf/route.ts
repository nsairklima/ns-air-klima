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

    // PDF létrehozása standard A4 méretben, kicsit optimalizált alsó-felső margóval
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
      // Kompaktabb sormagasság, hogy több tétel férjen el egy lapon
      const rowHeight = Math.max(textHeight + 8, 18);

      // Ha nagyon sok tétel lenne, csak akkor dobja át új oldalra
      if (y + rowHeight > 720) {
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

    // BIZTONSÁGI ELLENŐRZÉSE A LÁBLÉC ELŐTT
    // A teljes láblécnek (összesítő + szövegek + megjegyzés) kell kb. 140 pont.
    // Ha y > 660, átrakjuk a köv. oldalra, de a fenti tömörítéssel 9-12 tétel simán befér egy lapra!
    if (y > 660) { 
      doc.addPage(); 
      y = 50; 
    }

    // ÖSSZESÍTŐ BLOKK
    y += 10;
    doc.rect(340, y, 210, 26).lineWidth(1).strokeColor("#2c3e50").stroke();
    doc.font(fontBoldPath).fontSize(10).text("Fizetendő bruttó:", 350, y + 8);
    doc.fontSize(11).text(`${Number(quote.grossTotal).toLocaleString()} Ft`, 450, y + 8, { align: 'right', width: 90 });

    // LÁBLÉC INFORMÁCIÓK (A képed alapján pontosítva)
    y += 40;
    doc.font(fontPath).fontSize(9).fillColor("#005eb8").text("Köszönjük, hogy minket választott!", 50, y);
    
    y += 15;
    doc.fillColor("#444").fontSize(8).text("Árajánlatunkat az Ön igényeinek megfelelően állítottuk össze. Bízunk benne, hogy segítségére lesz a döntéshozatalban.", 50, y, { width: 500 });
    
    y += 16;
    doc.font(fontBoldPath).text("Érvényesség:", 50, y);
    doc.font(fontPath).text("7 nap", 110, y);
    
    // MEGJEGYZÉS BLOKK (Ami a képen átcsúszott a 2. oldalra)
    y += 20;
    doc.strokeColor("#eee").lineWidth(0.5).moveTo(50, y - 5).lineTo(550, y - 5).stroke();
    doc.font(fontBoldPath).fontSize(8).text("Megjegyzés: ", 50, y, { continued: true });
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
