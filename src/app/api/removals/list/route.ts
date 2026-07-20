import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface DbRow {
  ID_REMOCAO: string;
  DS_COMANDA: string;
  MESA: number;
  DS_PRODUTO: string | null;
  DS_ITEM: string;
  QTD: number;
  VL_VALOR: number;
  DS_MOTIVO: string;
  DS_STATUS: string;
  ID_SOLICITANTE: string;
  DS_SOLICITANTE: string;
  DT_SOLICITACAO: Date;
  ID_APROVADOR: string | null;
  DS_APROVADOR: string | null;
  DT_DECISAO: Date | null;
}

/**
 * Paginated audit read from the app-owned APP_REMOCAO_AUDITORIA table. When the
 * DB is not configured (or the table isn't provisioned yet) this returns
 * `{ available:false }` and the UI falls back to the local (localStorage) audit.
 */
export async function GET(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ available: false });
  }
  const p = request.nextUrl.searchParams;
  const page = Math.max(1, Number(p.get("page") ?? 1));
  const pageSize = Math.min(500, Math.max(1, Number(p.get("pageSize") ?? 50)));
  const waiterId = p.get("waiterId") || null;
  const tableNum = p.get("tableNum") ? Number(p.get("tableNum")) : null;
  const product = p.get("product") || null;
  const status = p.get("status") || null;
  const from = p.get("from") ? new Date(p.get("from") as string) : null;
  const to = p.get("to") ? new Date((p.get("to") as string) + "T23:59:59") : null;
  const offset = (page - 1) * pageSize;

  try {
    const { prisma } = await import("@/lib/prisma");
    const rows = await prisma.$queryRaw<DbRow[]>`
      SELECT ID_REMOCAO, DS_COMANDA, MESA, DS_PRODUTO, DS_ITEM, QTD, VL_VALOR,
             DS_MOTIVO, DS_STATUS, ID_SOLICITANTE, DS_SOLICITANTE, DT_SOLICITACAO,
             ID_APROVADOR, DS_APROVADOR, DT_DECISAO
      FROM dbo.APP_REMOCAO_AUDITORIA
      WHERE (${waiterId} IS NULL OR ID_SOLICITANTE = ${waiterId})
        AND (${tableNum} IS NULL OR MESA = ${tableNum})
        AND (${product} IS NULL OR DS_ITEM LIKE '%' + ${product} + '%')
        AND (${status} IS NULL OR DS_STATUS = ${status})
        AND (${from} IS NULL OR DT_SOLICITACAO >= ${from})
        AND (${to} IS NULL OR DT_SOLICITACAO <= ${to})
      ORDER BY DT_SOLICITACAO DESC
      OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY`;
    const totalRows = await prisma.$queryRaw<{ total: number | bigint }[]>`
      SELECT COUNT(*) AS total FROM dbo.APP_REMOCAO_AUDITORIA
      WHERE (${waiterId} IS NULL OR ID_SOLICITANTE = ${waiterId})
        AND (${tableNum} IS NULL OR MESA = ${tableNum})
        AND (${product} IS NULL OR DS_ITEM LIKE '%' + ${product} + '%')
        AND (${status} IS NULL OR DS_STATUS = ${status})
        AND (${from} IS NULL OR DT_SOLICITACAO >= ${from})
        AND (${to} IS NULL OR DT_SOLICITACAO <= ${to})`;

    const mapped = rows.map((r) => ({
      id: r.ID_REMOCAO,
      tableNum: Number(r.MESA),
      productId: r.DS_PRODUTO ?? "",
      itemName: r.DS_ITEM,
      qty: Number(r.QTD),
      amount: Number(r.VL_VALOR),
      reason: r.DS_MOTIVO,
      status: r.DS_STATUS,
      requesterId: r.ID_SOLICITANTE,
      requesterName: r.DS_SOLICITANTE,
      approverName: r.DS_APROVADOR ?? "—",
      requestedAt: r.DT_SOLICITACAO,
      decidedAt: r.DT_DECISAO,
    }));

    return NextResponse.json({
      available: true,
      rows: mapped,
      total: Number(totalRows[0]?.total ?? 0),
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Failed to read removal audit from DB:", error);
    return NextResponse.json({ available: false });
  }
}
