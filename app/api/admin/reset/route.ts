export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (token !== process.env.ADMIN_RESET_TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS public CASCADE;`);
    await prisma.$executeRawUnsafe(`CREATE SCHEMA public;`);
    await prisma.$executeRawUnsafe(`GRANT ALL ON SCHEMA public TO postgres;`);
    await prisma.$executeRawUnsafe(`GRANT ALL ON SCHEMA public TO public;`);

    return Response.json({ ok: true, message: "Schema reset complete" });
  } catch (e: any) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
