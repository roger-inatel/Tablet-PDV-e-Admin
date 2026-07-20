import { NextRequest, NextResponse } from "next/server";
import type { RemovalRecordInput } from "@/lib/erp/recordRemocao";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Degrade gracefully when the DB isn't configured (dev often has no VPS):
  // the localStorage audit stays authoritative and this is best-effort only.
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ available: false });
  }
  try {
    const body = (await request.json()) as RemovalRecordInput;
    const { recordRemocao } = await import("@/lib/erp/recordRemocao");
    await recordRemocao(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to record removal audit in DB:", error);
    return NextResponse.json(
      { message: "Erro ao gravar auditoria de remoção." },
      { status: 500 },
    );
  }
}
