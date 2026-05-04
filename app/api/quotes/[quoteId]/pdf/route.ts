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
      include: { client: true, items: true },
    });

    if (!quote) return NextResponse.json({ error: "Hiba" }, { status: 404 });

    // Dokumentum létrehozása - bufferPages kell a belső manipulációhoz
    const doc = new PDFDocument({ 
      margin: 30, 
      size: 'A4',
      bufferPages: true 
    });
    
    const chunks: any[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));

    const fontPath = path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf");
    const fontBoldPath = path.join(process.cwd(), "public/fonts/Roboto-Bold.ttf");
    doc.font(fontPath);

    // FEJLÉC
    doc.fontSize(18).text("ÁRAJÁNLAT", { align: "center" });
    let y = 60; 

    const line = (text: string, size = 10) => {
      doc.fontSize(size).text(text, 50, y);
      y += size + 3;
    };

    // ADATOK
    line(`Dátum: ${new Date(quote.createdAt).toLocaleDateString("hu-HU")}`);
    line(`Ajánlat száma: #${quote.id}`);
    y += 10;
    line("Ügyfél adatai:", 11);
    line(`${quote.client.name}`);
    line(`${quote.client.address || "-"}`);
    y += 15;

    // TÁBLÁZAT FEJLÉC
    doc.rect(50, y, 500, 15).fill("#f0f0f0");
    doc.fillColor("#000").fontSize(9).text("Megnevezés", 60, y + 3);
    doc.text("Menny.", 300, y + 3);
    doc.text("Bruttó egységár", 380, y + 3);
    doc.text("Bruttó összesen", 460, y + 3);
    y += 20;

    // TÉTELEK
    quote.items.forEach((item) => {
      doc.fontSize(9).text(item.description, 60, y, { width: 230 });
      doc.text(`${item.quantity} ${item.unit || "db"}`, 300, y);
      doc.text(`${item.unitPriceNet.toLocaleString()} Ft`, 380, y);
      doc.text(`${item.lineGross.toLocaleString()} Ft`, 460, y);
      const textHeight = doc.heightOfString(item.description, { width: 230 });
      y += Math.max(textHeight, 13);
    });

    // --- LÁBLÉC KÉNYSZERÍTETT POZÍCIONÁLÁSA ---
    // A trükk: Meghatározunk egy maximális Y értéket (700), ami felett már lecsúszna a Megjegyzés.
    // Ha a tételek lejjebb érnének, a láblécet "visszarántjuk" erre a pontra.
    let footerY = Math.max(y + 15, 640); 
    if (footerY > 700) footerY = 700; 

    // Fizetendő bruttó ablak
    doc.rect(350, footerY, 200, 28).stroke();
    doc.font(fontBoldPath).fontSize(10).text("Fizetendő bruttó:", 360, footerY + 9);
    doc.text(`${quote.grossTotal.toLocaleString()} Ft`, 460, footerY + 9, { align: 'right', width: 80 });

    // Szöveges lábléc elemek
    footerY += 35;
    doc.font(fontPath).fontSize(9).fillColor("#005eb8").text("Köszönjük, hogy minket választott!", 50, footerY);
    
    footerY += 12;
    doc.fillColor("#444").fontSize(8).text("Árajánlatunkat az Ön igényeinek megfelelően állítottuk össze.", 50, footerY);

    footerY += 15;
    // Érvényesség sáv
    doc.rect(50, footerY, 500, 12).fill("#f8f9fa");
    doc.fillColor("#000").font(fontBoldPath).text("Érvényesség:", 60, footerY + 2);
    doc.font(fontPath).text(" 7 nap", 120, footerY + 2);

    footerY += 15;
    // Megjegyzés sáv - Ez már garantáltan nem fog új oldalt nyitni
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
