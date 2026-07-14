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

    // Manuális oldalkezelés, hogy mi diktáljunk az Androidnak
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: 30, left: 35, right: 35, bottom: 60 },
      bufferPages: true,
      autoFirstPage: false 
    });
    
    const chunks: any[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    
    // Első oldal indítása
    doc.addPage();

    const fontPath = path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf");
    const fontBoldPath = path.join(process.cwd(), "public/fonts/Roboto-Bold.ttf");
    doc.font(fontPath);

    // Fejléc fix pozíción
    doc.fontSize(14).font(fontBoldPath).text("BRUTTÓ ÁRAJÁNLAT", 35, 30);
    doc.fontSize(8).font(fontPath).fillColor("#555");
    doc.text(`Sorszám: #${quote.id}  |  Dátum: ${new Date(quote.createdAt).toLocaleDateString("hu-HU")}`, 35, 47);

    // Vevő adatai
    doc.font(fontBoldPath).fillColor("#000").text("Megrendelő:", 320, 30);
    doc.font(fontPath).text(`${quote.client.name} (${quote.client.address || "-"})`, 320, 42, { width: 240 });

    // Táblázat fejléc
    let y = 75;
    doc.rect(35, y, 525, 14).fill("#eef2f5");
    doc.fillColor("#000").fontSize(8).font(fontBoldPath).text("Megnevezés", 42, y + 3);
    doc.text("Menny.", 310, y + 3);
    doc.text("Egységár", 385, y + 3);
    doc.text("Összesen", 475, y + 3);
    y += 18;

    doc.font(fontPath).fontSize(8).fillColor("#222");
    
    // Tételek listázása kőkemény magassági korláttal
    quote.items.forEach((item) => {
      // BRUTÁLIS ANDROID KORLÁT: Ha az Y elérné a 420-at (ami a lapnak még csak a KÖZEPE!), 
      // azonnal új lapot nyitunk. Így fizikai képtelenség, hogy elérje az alját.
      if (y > 420) {
        doc.addPage();
        y = 40; // Az új oldalon fent kezdünk
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

    // Ha a tételek után az Y túl magas lenne, a láblécet egy teljesen üres, tiszta új lapra rakjuk
    if (y > 400) {
      doc.addPage();
      y = 40;
    }

    // A lábléc kezdetét fixen bebetonozzuk 450-re (Hatalmas üres tér marad alul!)
    const footerStartY = Math.max(y + 20, 450); 

    // Elválasztó vonal
    doc.strokeColor("#2c3e50").lineWidth(1).moveTo(35, footerStartY).lineTo(560, footerStartY).stroke();

    // Bal oldali szövegek
    let infoY = footerStartY + 15;
    doc.font(fontBoldPath).fontSize(8.5).fillColor("#005eb8").text("Köszönjük a megkeresést!", 35, infoY);
    doc.font(fontPath).fontSize(7.5).fillColor("#555");
    doc.text("Az ajánlatunk 7 napig érvényes.", 35, infoY + 14);
    doc.font(fontBoldPath).text("Megjegyzés: ", 35, infoY + 28, { continued: true });
    doc.font(fontPath).text("Alanyi adómentes értékesítés, a végösszeget ÁFA nem terheli.");

    // Jobb oldali összesítő doboz
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
