import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { password, moduleKey } = await req.json();

    const MASTER = process.env.MASTER_PASSWORD;
    const MODULE_SPECIFIC = process.env[`${moduleKey}_PASSWORD`];

    // Ha a jelszó egyezik a Masterrel VAGY a modul sajátjával
    if (password === MASTER || (MODULE_SPECIFIC && password === MODULE_SPECIFIC)) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Hibás jelszó!" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 });
  }
}
