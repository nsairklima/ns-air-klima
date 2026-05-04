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
        items: true,
      },
    });

    if (!quote) {
      return NextResponse.json({ error: "Ajánlat nem található" }, { status: 404 });
    }

    // PDF létrehozása - Kisebb margókkal (25), hogy minden elférjen
    const doc = new PDFDocument({ 
      margin: 25,
      size: 'A4'
    });
    
    const chunks: any[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));

    // Magyar karakterek támogatása (Roboto betűtípus betöltése a public mappából)
    const fontPath = path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf");
    const fontBoldPath = path.join(process.cwd(), "public/fonts/Roboto-Bold.ttf");
    doc.font(fontPath);

    // Fejléc
    doc.fontSize(18).text("ÁRAJÁNLAT", { align: "center" });
    
    let y = 60; 
    const line = (text: string, size = 11) => {
      doc.fontSize(size).text(text, 50, y);
      y += size + 3;
    };

    // Alapadatok
    line(`Dátum: ${new Date(quote.createdAt).toLocaleDateString("hu-HU")}`);
    line(`Ajánlat száma: #${quote.id}`);
    line(`Státusz: ${quote.status === 'accepted' ? 'Elfogadva' : 'Folyamatban'}`);
    y += 8;

    // Ügyfél adatok
    line("Ügyfél adatai:", 12);
    line(`Név: ${quote.client.name}`);
    line(`Cím: ${quote.client.address || "-"}`);
    line(`Telefon: ${quote.client.phone || "-"}`);
    y += 15;

    // Tételek táblázat fejléce
    line("Tételek:", 12);
    doc.rect(50, y, 500, 18).fill("#f0f0f0");
    doc.fillColor("#000").fontSize(9).text("Leírás", 60, y + 4);
    doc.text("Menny.", 300, y + 4);
    doc.text("Egységár", 380, y + 4);
    doc.text("Összesen", 460, y + 4);
    y += 22;

    // Tételek listázása
    quote.items.forEach((item) => {
      doc.fontSize(9).text(item.description, 60, y, { width: 230 });
      doc.text(`${item.quantity} ${item.unit || "db"}`, 300, y);
      doc.text(`${item.unitPriceNet.toLocaleString()} Ft`, 380, y);
      doc.text(`${item.lineGross.toLocaleString()} Ft`, 460, y);
      
      const textHeight = doc.heightOfString(item.description, { width: 230 });
      y += Math.max(textHeight, 13); 
    });

    // Összesítő rész feljebb hozása
    y += 10;
    
    // Ha az y túl közel érne az oldal aljához, itt korlátozzuk
    if (y > 740) y = 730; 

    // Fizetendő bruttó doboz
    doc.rect(350, y, 200, 28).stroke();
    doc.font(fontBoldPath).fontSize(10)
       .text(`Fizetendő bruttó:`, 360, y + 9);
    doc.text(`${quote.grossTotal.toLocaleString()} Ft`, 460, y + 9, { align: 'right', width: 80 });

    // Lábléc blokk felhúzása (kevesebb térköz)
    y += -65; 

    doc.font(fontPath).fontSize(9).fillColor("#005eb8")
       .text("Köszönjük, hogy minket választott!", 50, y);
    
    y += 12;
    doc.fillColor("#444").fontSize(8)
       .text("Árajánlatunkat az Ön igényeinek megfelelően állítottuk össze.", 50, y);

    y += 15;
    // Érvényesség sáv
    doc.rect(50, y, 500, 12).fill("#f8f9fa");
    doc.fillColor("#000").font(fontBoldPath).text("Érvényesség:", 60, y + 2);
    doc.font(fontPath).text(" 7 nap", 120, y + 2);

    // Megjegyzés sáv - Közvetlenül alá, hogy ne lógjon le a második oldalra
    y += 15; 
    doc.rect(50, y, 500, 12).fill("#f8f9fa");
    doc.fillColor("#000").font(fontBoldPath).fontSize(8)
       .text("Megjegyzés:", 60, y + 2);
    doc.font(fontPath)
       .text(" Az ajánlat készítője alanyi adómentes, ezért a végösszeget az Áfa mértéke nem befolyásolja.", 115, y + 2);

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
