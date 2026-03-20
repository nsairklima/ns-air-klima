import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const expected = process.env.ADMIN_RESET_TOKEN || "";
  if (!token || token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

    // 3) Töröljük a hibás migrációs rekordot
    await prisma.$executeRawUnsafe(
      `DELETE FROM "_prisma_migrations" WHERE "migration_name" = '0002_quotes';`
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "repair failed" }, { status: 500 });
  }
}
