import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";

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
        items: true,
      },
    });

    if (!quote) {
      return NextResponse.json({ error: "Ajánlat nem található" }, { status: 404 });
    }

    // PDF létrehozása kisebb margóval (30), hogy több hely legyen az oldalon
    const doc = new PDFDocument({ 
      margin: 30,
      size: 'A4'
    });
    
    const chunks: any[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));

    // Fejléc - Kicsit kisebb betű és feljebb tolva
    doc.fontSize(18).text("ÁRAJÁNLAT", { align: "center" });
    
    // Kezdő koordináta feljebb hozva (100-ról 60-ra)
    let y = 60; 
    const line = (text: string, size = 11) => {
      doc.fontSize(size).text(text, 50, y);
      y += size + 3; // Kisebb sorköz
    };

    // Alapadatok szekció
    line(`Dátum: ${new Date(quote.createdAt).toLocaleDateString("hu-HU")}`);
    line(`Ajánlat száma: #${quote.id}`);
    line(`Státusz: ${quote.status === 'accepted' ? 'Elfogadva' : 'Folyamatban'}`);
    y += 8;

    // Ügyfél adatok szekció
    line("Ügyfél adatai:", 12);
    line(`Név: ${quote.client.name}`);
    line(`Cím: ${quote.client.address || "-"}`);
    line(`Telefon: ${quote.client.phone || "-"}`);
    y += 15;

    // Tételek táblázat fejléce - Kompaktabb magasság
    line("Tételek:", 12);
    doc.rect(50, y, 500, 18).fill("#f0f0f0");
    doc.fillColor("#000").fontSize(9).text("Leírás", 60, y + 4);
    doc.text("Menny.", 300, y + 4);
    doc.text("Egységár", 380, y + 4);
    doc.text("Összesen", 460, y + 4);
    y += 22;

    // Tételek listázása - Sűrűbb sorok
    quote.items.forEach((item) => {
      doc.fontSize(9).text(item.description, 60, y, { width: 230 });
      doc.text(`${item.quantity} ${item.unit || "db"}`, 300, y);
      doc.text(`${item.unitPriceNet.toLocaleString()} Ft`, 380, y);
      doc.text(`${item.lineGross.toLocaleString()} Ft`, 460, y);
      
      // Ha a leírás hosszú és több sorba törik, igazítsuk az y-t
      const textHeight = doc.heightOfString(item.description, { width: 230 });
      y += Math.max(textHeight, 13); 
    });

    // Összesítő - Közvetlenül a tételek alá, nem fix távolságra
    y += 15;
    
    // Ha az y túl közel érne az oldal aljához, itt még megállítjuk
    if (y > 750) y = 740; 

    doc.rect(350, y, 200, 38).stroke();
    
    // Nettó sor
    doc.fillColor("#000")
       .fontSize(10)
       .text(`Nettó: ${quote.netTotal.toLocaleString()} Ft`, 360, y + 6);
    
    // BRUTTÓ sor - A 'fontWeight' helyett betűtípust váltunk (Helvetica-Bold)
    doc.font('Helvetica-Bold')
       .fontSize(12)
       .text(`BRUTTÓ: ${quote.grossTotal.toLocaleString()} Ft`, 360, y + 20);

    // Visszaállítjuk az alap betűtípust, hogy ne maradjon minden félkövér
    doc.font('Helvetica');

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
    return NextResponse.json({ error: "PDF generálási hiba" }, { status: 500 });
  }
}
