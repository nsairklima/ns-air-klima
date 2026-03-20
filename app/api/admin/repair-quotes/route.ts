// app/api/admin/repair-quotes/route.ts
// Javító endpoint a P3009 (failed migration) kitakarítására.
// GET és POST metódussal is hívható.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function runRepair() {
  // Töröljük a QuoteItem és Quote táblát, ha léteznek
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "QuoteItem" CASCADE;`);
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "Quote" CASCADE;`);

  // Enum törlése, ha létezik
  await prisma.$executeRawUnsafe(`DO $$
  BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'QuoteStatus') THEN
      DROP TYPE "QuoteStatus";
    END IF;
  END$$;`);

  // Migrációs rekord törlése
  await prisma.$executeRawUnsafe(`
    DELETE FROM "_prisma_migrations"
    WHERE "migration_name" = '0002_quotes';
  `);

  return { ok: true };
}

async function handler(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const expected = process.env.ADMIN_RESET_TOKEN || "";

  if (!token || token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runRepair();
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "repair failed" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return handler(req);
}
export async function POST(req: Request) {
  return handler(req);
}
