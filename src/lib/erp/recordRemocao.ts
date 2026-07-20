import { prisma } from "@/lib/prisma";
import type { RemovalStatus } from "@/types";

// App-owned audit table (not part of the introspected ERP). Created by hand
// via prisma/sql/create_remocao_auditoria.sql — NEVER prisma migrate, which
// would try to reconcile the whole ERP. We write with raw SQL so no Prisma
// model / client regeneration is required.

export interface RemovalRecordInput {
  removalId: string;
  checkId: string;
  tableNum: number;
  productId: string;
  itemName: string;
  qty: number;
  amount: number;
  reason: string;
  status: RemovalStatus;
  requestedByWaiterId: string;
  requestedByName: string;
  requestedAt: string; // ISO
  decidedByManagerId?: string;
  decidedByName?: string;
  decidedAt?: string; // ISO
}

/**
 * Upsert (MERGE) a removal audit row. Idempotent on ID_REMOCAO so a
 * PENDING→APPROVED/REJECTED transition updates the same row. Rows are never
 * deleted (audit).
 */
export async function recordRemocao(input: RemovalRecordInput): Promise<void> {
  const decidedAt = input.decidedAt ? new Date(input.decidedAt) : null;
  await prisma.$executeRaw`
    MERGE dbo.APP_REMOCAO_AUDITORIA AS target
    USING (SELECT ${input.removalId} AS ID_REMOCAO) AS src
      ON target.ID_REMOCAO = src.ID_REMOCAO
    WHEN MATCHED THEN UPDATE SET
      DS_STATUS = ${input.status},
      ID_APROVADOR = ${input.decidedByManagerId ?? null},
      DS_APROVADOR = ${input.decidedByName ?? null},
      DT_DECISAO = ${decidedAt}
    WHEN NOT MATCHED THEN INSERT
      (ID_REMOCAO, DS_COMANDA, MESA, DS_PRODUTO, DS_ITEM, QTD, VL_VALOR,
       DS_MOTIVO, DS_STATUS, ID_SOLICITANTE, DS_SOLICITANTE, DT_SOLICITACAO,
       ID_APROVADOR, DS_APROVADOR, DT_DECISAO)
      VALUES
      (${input.removalId}, ${input.checkId}, ${input.tableNum}, ${input.productId},
       ${input.itemName}, ${input.qty}, ${input.amount}, ${input.reason},
       ${input.status}, ${input.requestedByWaiterId}, ${input.requestedByName},
       ${new Date(input.requestedAt)}, ${input.decidedByManagerId ?? null},
       ${input.decidedByName ?? null}, ${decidedAt});
  `;
}
