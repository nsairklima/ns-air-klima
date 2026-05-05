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
            sortOrder: 'asc' // <--- A tételek sorrendjének érvényesítése
          }
        } 
      },
    });

    if (!quote) return NextResponse.json({ error: "Hiba" }, { status: 404 });

    // PDF Dokumentum beállítása (Auto Page Break kikapcsolva az egy oldal érdekében)
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: 20, left: 30, right: 30, bottom: 0 },
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
    doc.fontSize(18).text("ÁRAJÁNLAT", { align: "center" });
    let y = 50; 

    // ADATOK
    doc.fontSize(10).text(`Dátum: ${new Date(quote.createdAt).toLocaleDateString("hu-HU")}`, 50, y);
    y += 15;
    doc.text(`Ajánlat száma: #${quote.id}`, 50, y);
    y += 20;
    doc.fontSize(11).font(fontBoldPath).text("Ügyfél adatai:", 50, y);
    doc.font(fontPath).fontSize(10);
    y += 15;
    doc.text(`${quote.client.name}`, 50, y);
    y += 12;
    doc.text(`${quote.client.address || "-"}`, 50, y);
    y += 20;

    // TÁBLÁZAT FEJLÉC
    doc.rect(50, y, 500, 15).fill("#f0f0f0");
    doc.fillColor("#000").fontSize(9).font(fontBoldPath).text("Megnevezés", 60, y + 3);
    doc.text("Menny.", 300, y + 3);
    doc.text("Bruttó egységár", 380, y + 3);
    doc.text("Bruttó összesen", 460, y + 3);
    y += 20;

    // TÉTELEK (Rendezett lista)
    doc.font(fontPath).fillColor("#000");
    quote.items.forEach((item) => {
      doc.fontSize(9).text(item.description, 60, y, { width: 230 });
      doc.text(`${item.quantity} ${item.unit || "db"}`, 300, y);
      doc.text(`${Number(item.unitPriceNet).toLocaleString()} Ft`, 380, y);
      doc.text(`${Number(item.lineGross).toLocaleString()} Ft`, 460, y);
      
      const textHeight = doc.heightOfString(item.description, { width: 230 });
      y += Math.max(textHeight, 13);
    });

    // --- FIX LÁBLÉC BLOKK (Kényszerített pozíció az oldal alján) ---
    let footerY = Math.max(y + 15, 660);
    if (footerY > 715) footerY = 715; 

    // Végösszeg ablak
    doc.rect(350, footerY, 200, 26).stroke();
    doc.font(fontBoldPath).fontSize(10).text("Fizetendő bruttó:", 360, footerY + 8);
    doc.text(`${Number(quote.grossTotal).toLocaleString()} Ft`, 460, footerY + 8, { align: 'right', width: 80 });

    footerY += 32;
    doc.font(fontPath).fontSize(9).fillColor("#005eb8").text("Köszönjük, hogy minket választott!", 50, footerY);
    
    footerY += 12;
    doc.fillColor("#444").fontSize(8).text("Árajánlatunkat az Ön igényeinek megfelelően állítottuk össze.", 50, footerY);

    footerY += 14;
    // Érvényesség sáv
    doc.rect(50, footerY, 500, 12).fill("#f8f9fa");
    doc.fillColor("#000").font(fontBoldPath).text("Érvényesség:", 60, footerY + 2);
    doc.font(fontPath).text(" 7 nap", 120, footerY + 2);

    footerY += 14;
    // Megjegyzés sáv
    doc.rect(50, footerY, 500, 12).fill("#f8f9fa");
    doc.fillColor("#000").font(fontBoldPath).text("Megjegyzés:", 60, footerY + 2);
    doc.font(fontPath).text(" Az ajánlat készítője alanyi adómentes, ezért a végösszeget az Áfa mértéke nem befolyásolja.", 115, footerY + 2);

    doc.end();

    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=ajanlat_${quote.id}.pdf`,
      },
    });
  } catch (error) {
    console.error("PDF hiba:", error);
    return NextResponse.json({ error: "Hiba" }, { status: 500 });
  }
}
