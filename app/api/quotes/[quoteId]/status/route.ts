export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const id = Number(params.quoteId);
    const body = await req.json();

    // engedélyezett státuszok
    const allowedStatuses = ["draft", "sent", "accepted", "rejected"];
    if (!allowedStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: "Érvénytelen státusz." },
        { status: 400 }
      );
    }

    const updated = await prisma.quote.update({
      where: { id },
      data: {
        status: body.status,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("STATUS API error:", err);
    return NextResponse.json(
      { error: "Hiba a státusz frissítésekor." },
      { status: 500 }
    );
  }
}
