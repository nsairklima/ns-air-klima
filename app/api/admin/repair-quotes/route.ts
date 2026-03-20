// app/api/admin/repair-quotes/route.ts
// Egyszeri javító végpont a félbemaradt 0002_quotes migráció (P3009) kitisztítására.
// GET ÉS POST módszerrel is hívható: ?token=<ADMIN_RESET_TOKEN>

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function runRepair() {
  // 1) Töröljük a QuoteItem és Quote táblákat, ha léteznek
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "QuoteItem" CASCADE;`);
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "Quote" CASCADE;`);

  // 2) Töröljük az enumot, ha létezik
  await prisma.$executeRawUnsafe(`DO $$
  BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'QuoteStatus') THEN
      DROP TYPE "QuoteStatus";
    END IF;
  END$$;`);

  // 3) Töröljük a hibás migrációs rekordot (ha benne ragadt)
  await prisma.$executeRawUnsafe(
    `DELETE FROM "_prisma_migrations" WHERE "migration_name" = '0002_quotes';`
  );

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
