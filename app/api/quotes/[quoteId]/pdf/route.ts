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

    // BUFFER ÉS DOKUMENTUM LÉTREHOZÁSA
    // autoFirstPage: true, de a fontos: bufferPages: true, hogy tudjunk az oldallal babrálni
    const doc = new PDFDocument({ 
      margin: 30, 
      size: 'A4',
      bufferPages: true,
      autoFirstPage: true 
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

    // --- LÁBLÉC BLOKK KÉNYSZERÍTETT FELHÚZÁSA ---
    // Ha y túl nagy lenne, megállítjuk 650-nél, hogy minden kiférjen alatta
    if (y > 650) y = 650; 
    y += 15;

    // ÖSSZESÍTŐ (A kép alapján: Fizetendő bruttó)
    doc.rect(350, y, 200, 25).stroke();
    doc.font(fontBoldPath).fontSize(10).text("Fizetendő bruttó:", 360, y + 8);
    doc.text(`${quote.grossTotal.toLocaleString()} Ft`, 460, y + 8, { align: 'right', width: 80 });

    y += 40; 

    // ALSÓ SZÖVEGEK (Köszönjük, Érvényesség, Megjegyzés)
    doc.font(fontPath).fontSize(9).fillColor("#005eb8").text("Köszönjük, hogy minket választott!", 50, y);
    
    y += 12;
    doc.fillColor("#444").fontSize(8).text("Árajánlatunkat az Ön igényeinek megfelelően állítottuk össze.", 50, y);

    y += 15;
    // Érvényesség
    doc.rect(50, y, 500, 12).fill("#f8f9fa");
    doc.fillColor("#000").font(fontBoldPath).text("Érvényesség:", 60, y + 2);
    doc.font(fontPath).text(" 7 nap", 120, y + 2);

    y += 15;
    // Megjegyzés - Ez már biztosan nem fog lecsúszni
    doc.rect(50, y, 500, 12).fill("#f8f9fa");
    doc.fillColor("#000").font(fontBoldPath).text("Megjegyzés:", 60, y + 2);
    doc.font(fontPath).text(" Az ajánlat készítője alanyi adómentes, ezért a végösszeget az Áfa mértéke nem befolyásolja.", 115, y + 2);

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
