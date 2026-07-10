import { NextRequest, NextResponse } from "next/server";
import { recordPedido, type RecordPedidoInput } from "@/lib/erp/recordPedido";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RecordPedidoInput;
    await recordPedido(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to record pedido in ERP:", error);

    return NextResponse.json(
      { message: "Erro ao gravar pedido no ERP." },
      { status: 500 },
    );
  }
}
