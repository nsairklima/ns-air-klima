import { NextResponse } from 'next/server';
import { Resend } from "resend";

export const dynamic = 'force-dynamic';

// Csak akkor importáljuk a prismát, ha nem build folyamatban vagyunk
// Ez megakadályozza, hogy a Next.js buildere hozzányúljon a DB klienshez
const getPrisma = async () => {
  if (process.env.NEXT_PHASE === 'phase-production-build') return null;
  const { prisma } = await import("@/lib/prisma");
  return prisma;
};

const resend = new Resend(process.env.RESEND_API_KEY);

async function performBackup() {
  // Build fázisban azonnal térjen vissza üres sikerrel
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return { success: true, message: "Build skip" };
  }

  const prisma = await getPrisma();
  if (!prisma) return { success: false, message: "Database not available" };

  try {
    const clients = await prisma.client.findMany({
      include: { 
        units: { 
          include: { 
            maintenance: true 
          } 
        } 
      }
    });

    let inventory = [];
    try {
      inventory = await (prisma as any).item.findMany();
    } catch (e) {
      console.log("Raktár tábla kihagyva.");
    }

    const backupData = JSON.parse(JSON.stringify({
      timestamp: new Date().toLocaleString('hu-HU'),
      type: "ADATBÁZIS MENTÉS",
      data: { clients, inventory }
    }, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    if (process.env.RESEND_API_KEY) {
      const reportDate = new Date().toLocaleDateString('hu-HU');
      await resend.emails.send({
        from: "NS-AIR Rendszer <onboarding@resend.dev>",
        to: "nsair.klima@gmail.com",
        subject: `📋 Rendszerjelentés és Mentés - ${reportDate}`,
        html: `<p>Automatikus mentés: ${new Date().toLocaleString('hu-HU')}</p>`,
        attachments: [
          {
            filename: `nsair_backup_${new Date().toISOString().split('T')[0]}.json`,
            content: Buffer.from(JSON.stringify(backupData, null, 2)).toString('base64'),
          }
        ]
      });
    }

    return { success: true, message: "Mentés kész." };
  } catch (err: any) {
    console.error("Backup error detail:", err);
    throw err;
  }
}

export async function POST() {
  try {
    const result = await performBackup();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const result = await performBackup();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
