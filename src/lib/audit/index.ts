import type { RemovalRequest, RemovalStatus, Waiter } from "@/types";

// Normalized audit row (source-agnostic: derived from the store or the DB).

export interface AuditRow {
  id: string;
  tableNum: number;
  productId: string;
  itemName: string;
  qty: number;
  amount: number;
  reason: string;
  status: RemovalStatus;
  requesterId: string;
  requesterName: string;
  approverName: string;
  requestedAt: string; // ISO
  decidedAt?: string; // ISO
}

export interface AuditFilters {
  from?: string; // yyyy-mm-dd (inclusive)
  to?: string; // yyyy-mm-dd (inclusive)
  waiterId?: string;
  tableNum?: number;
  product?: string; // case-insensitive substring
  status?: RemovalStatus | "ALL";
}

export function toAuditRows(
  removals: RemovalRequest[],
  waiters: Waiter[],
): AuditRow[] {
  const byId = new Map(waiters.map((w) => [w.id, w.name]));
  return removals
    .map((r) => ({
      id: r.id,
      tableNum: r.tableNum,
      productId: r.productId,
      itemName: r.itemName,
      qty: r.qty,
      amount: r.amount,
      reason: r.reason,
      status: r.status,
      requesterId: r.requestedByWaiterId,
      requesterName: byId.get(r.requestedByWaiterId) ?? "—",
      approverName: r.decidedByManagerId
        ? byId.get(r.decidedByManagerId) ?? "—"
        : "—",
      requestedAt: r.requestedAt,
      decidedAt: r.decidedAt,
    }))
    .sort(
      (a, b) =>
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
    );
}

export function filterAuditRows(
  rows: AuditRow[],
  f: AuditFilters,
): AuditRow[] {
  const fromTs = f.from ? new Date(f.from + "T00:00:00").getTime() : null;
  const toTs = f.to ? new Date(f.to + "T23:59:59").getTime() : null;
  const product = f.product?.trim().toLowerCase();
  return rows.filter((r) => {
    const ts = new Date(r.requestedAt).getTime();
    if (fromTs !== null && ts < fromTs) return false;
    if (toTs !== null && ts > toTs) return false;
    if (f.waiterId && r.requesterId !== f.waiterId) return false;
    if (f.tableNum != null && r.tableNum !== f.tableNum) return false;
    if (product && !r.itemName.toLowerCase().includes(product)) return false;
    if (f.status && f.status !== "ALL" && r.status !== f.status) return false;
    return true;
  });
}

export const AUDIT_STATUS_LABEL: Record<RemovalStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
};

export function auditDateTime(iso: string | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
