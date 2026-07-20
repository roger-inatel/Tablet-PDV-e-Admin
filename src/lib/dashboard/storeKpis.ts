import type { Check, Order, RemovalRequest, Table, Waiter } from "@/types";
import { activeItems, checkTotal } from "@/lib/domain/order";

// Live operational + removal KPIs derived from the in-memory store (the ERP
// only holds paid orders — KDS timings and removals live in the app layer).

export interface OperationalKpis {
  occupied: number;
  tablesTotal: number;
  openChecks: number;
  inCheckout: number;
  preparing: number;
  ready: number;
}

export function liveOperational(
  tables: Table[],
  checks: Check[],
  orders: Order[],
): OperationalKpis {
  let preparing = 0;
  let ready = 0;
  for (const o of orders) {
    for (const it of activeItems(o)) {
      if (it.status === "PREPARING") preparing += it.qty;
      else if (it.status === "READY") ready += it.qty;
    }
  }
  return {
    occupied: tables.filter((t) => t.checkId !== null).length,
    tablesTotal: tables.length,
    openChecks: checks.filter((c) => c.status !== "CLOSED").length,
    inCheckout: checks.filter((c) => c.status === "IN_CHECKOUT").length,
    preparing,
    ready,
  };
}

export interface RankRow {
  key: string;
  count: number;
  loss: number;
}

function rank(
  rows: RemovalRequest[],
  keyOf: (r: RemovalRequest) => string,
): RankRow[] {
  const map = new Map<string, RankRow>();
  for (const r of rows) {
    const key = keyOf(r);
    const cur = map.get(key) ?? { key, count: 0, loss: 0 };
    cur.count += 1;
    cur.loss += r.amount;
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export interface RemovalKpis {
  approved: number;
  pending: number;
  loss: number;
  byItem: RankRow[];
  byReason: RankRow[];
}

export function removalStats(removals: RemovalRequest[]): RemovalKpis {
  const approved = removals.filter((r) => r.status === "APPROVED");
  return {
    approved: approved.length,
    pending: removals.filter((r) => r.status === "PENDING").length,
    loss: approved.reduce((s, r) => s + r.amount, 0),
    byItem: rank(approved, (r) => r.itemName),
    byReason: rank(approved, (r) => r.reason),
  };
}

export interface WaiterRankRow {
  waiterId: string;
  name: string;
  initials: string;
  color: string;
  checks: number;
  outstanding: number;
}

/** Live per-waiter ranking from active checks (ERP has no waiter attribution). */
export function waiterRanking(
  checks: Check[],
  orders: Order[],
  waiters: Waiter[],
): WaiterRankRow[] {
  const byId = new Map(waiters.map((w) => [w.id, w]));
  const map = new Map<string, WaiterRankRow>();
  for (const c of checks) {
    if (c.status === "CLOSED") continue;
    const w = byId.get(c.waiterId);
    const row =
      map.get(c.waiterId) ?? {
        waiterId: c.waiterId,
        name: w?.name ?? "—",
        initials: w?.initials ?? "--",
        color: w?.color ?? "#94a3b8",
        checks: 0,
        outstanding: 0,
      };
    row.checks += 1;
    row.outstanding += checkTotal(
      c,
      orders.filter((o) => o.checkId === c.id),
    );
    map.set(c.waiterId, row);
  }
  return [...map.values()].sort((a, b) => b.checks - a.checks);
}
