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

    // PDF létrehozása
    const doc = new PDFDocument({ margin: 50 });
    const chunks: any[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));

    // Fejléc
    doc.fontSize(20).text("ÁRAJÁNLAT", { align: "center" });
    doc.moveDown();

    let y = 100;
    const line = (text: string, size = 12) => {
      doc.fontSize(size).text(text, 50, y);
      y += size + 5;
    };

    // Alapadatok
    line(`Dátum: ${new Date(quote.createdAt).toLocaleDateString("hu-HU")}`);
    // JAVÍTÁS: quoteNo helyett id-t használunk
    line(`Ajánlat száma: #${quote.id}`);
    line(`Státusz: ${quote.status === 'accepted' ? 'Elfogadva' : 'Folyamatban'}`);
    y += 10;

    // Ügyfél adatok
    line("Ügyfél adatai:", 14);
    line(`Név: ${quote.client.name}`);
    line(`Cím: ${quote.client.address || "-"}`);
    line(`Telefon: ${quote.client.phone || "-"}`);
    y += 20;

    // Tételek táblázat fejléce
    line("Tételek:", 14);
    doc.rect(50, y, 500, 20).fill("#f0f0f0");
    doc.fillColor("#000").fontSize(10).text("Leírás", 60, y + 5);
    doc.text("Menny.", 300, y + 5);
    doc.text("Egységár", 380, y + 5);
    doc.text("Összesen", 460, y + 5);
    y += 25;

    // Tételek listázása
    quote.items.forEach((item) => {
      doc.fontSize(10).text(item.description, 60, y);
      doc.text(`${item.quantity} ${item.unit || "db"}`, 300, y);
      doc.text(`${item.unitPriceNet.toLocaleString()} Ft`, 380, y);
      doc.text(`${item.lineGross.toLocaleString()} Ft`, 460, y);
      y += 15;
    });

    y += 20;
    // Összesítő
    doc.rect(350, y, 200, 40).stroke();
    doc.fontSize(12).text(`Nettó: ${quote.netTotal.toLocaleString()} Ft`, 360, y + 5);
    doc.fontSize(14).text(`BRUTTÓ: ${quote.grossTotal.toLocaleString()} Ft`, 360, y + 20);

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
