import type { Prisma } from "@/generated/prisma/client";

// Legacy ERP tables (TB_PEDIDO, TB_PEDIDO_ITEM, TB_PEDIDO_PARCELA, ...) use
// manually-assigned integer keys — no IDENTITY column. UPDLOCK+HOLDLOCK keeps
// the range locked for the rest of the caller's transaction, so two
// concurrent checkouts can't compute the same "next" value.
export async function nextId(
  tx: Prisma.TransactionClient,
  table: string,
  column: string,
): Promise<number> {
  const rows = await tx.$queryRawUnsafe<{ next: number }[]>(
    `SELECT ISNULL(MAX(${column}), 0) + 1 AS next FROM dbo.${table} WITH (UPDLOCK, HOLDLOCK)`,
  );
  return rows[0].next;
}
