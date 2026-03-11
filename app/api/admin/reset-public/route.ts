export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token || token !== process.env.ADMIN_RESET_TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // public séma teljes reset
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS public CASCADE;`);
    await prisma.$executeRawUnsafe(`CREATE SCHEMA public;`);
    await prisma.$executeRawUnsafe(`GRANT ALL ON SCHEMA public TO postgres;`);
    await prisma.$executeRawUnsafe(`GRANT ALL ON SCHEMA public TO public;`);

    return Response.json({ ok: true, message: "public schema reset done" });
  } catch (e: any) {
    console.error(e);
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

// kényelmi GET, hogy böngészőből is lehessen hívni
export async function GET(req: Request) {
  return POST(req);
}
