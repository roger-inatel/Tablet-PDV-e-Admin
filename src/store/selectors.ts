import type {
  Check,
  ChipKind,
  Order,
  OrderItemStatus,
  Session,
  Station,
  Table,
  Waiter,
  WaiterStatus,
} from "@/types";
import { checkTotal } from "@/lib/domain/order";
import { belongsToStation, stationStage } from "@/lib/domain/order";

// Pure derivations over the store state (call inside useMemo).

export function waitersById(waiters: Waiter[]): Record<string, Waiter> {
  return waiters.reduce(
    (acc, w) => {
      acc[w.id] = w;
      return acc;
    },
    {} as Record<string, Waiter>,
  );
}

export function checkById(
  checks: Check[],
  id: string | null,
): Check | undefined {
  return id ? checks.find((c) => c.id === id) : undefined;
}

export function ordersOfCheck(orders: Order[], checkId: string): Order[] {
  return orders
    .filter((o) => o.checkId === checkId)
    .sort((a, b) => a.seq - b.seq);
}

// ---- waiter surface ---------------------------------------------------------

export type TableViewKind = "free" | "mine" | "other";

export interface TableView {
  table: Table;
  kind: TableViewKind;
  check?: Check;
  waiter?: Waiter;
  total: number;
  itemCount: number;
  inCheckout: boolean;
}

export function tableViews(
  tables: Table[],
  checks: Check[],
  orders: Order[],
  waiters: Waiter[],
  session: Session | null,
): TableView[] {
  const byId = waitersById(waiters);
  const myId =
    session && session.role !== "station" ? session.waiterId : null;
  return tables.map((table) => {
    const check = checkById(checks, table.checkId);
    if (!check) {
      return { table, kind: "free", total: 0, itemCount: 0, inCheckout: false };
    }
    const checkOrders = ordersOfCheck(orders, check.id);
    const itemCount =
      check.draftItems.reduce((s, d) => s + d.qty, 0) +
      checkOrders.reduce((s, o) => s + o.items.reduce((a, i) => a + i.qty, 0), 0);
    return {
      table,
      kind: check.waiterId === myId ? "mine" : "other",
      check,
      waiter: byId[check.waiterId],
      total: checkTotal(check, checkOrders),
      itemCount,
      inCheckout: check.status === "IN_CHECKOUT",
    };
  });
}

export function myTablesCount(views: TableView[]): number {
  return views.filter((v) => v.kind === "mine").length;
}

// ---- KDS --------------------------------------------------------------------

export interface KdsCard {
  order: Order;
  /** Least-advanced status among the station's items (board column). */
  stage: OrderItemStatus;
}

/** Station queue: orders with items for this station. */
export function kdsQueue(orders: Order[], station: Station): KdsCard[] {
  return orders
    .filter((o) => belongsToStation(o, station))
    .map((o) => ({ order: o, stage: stationStage(o, station)! }))
    .sort(
      (a, b) =>
        new Date(a.order.createdAt).getTime() -
        new Date(b.order.createdAt).getTime(),
    );
}

// ---- admin ------------------------------------------------------------------

export function activeChecks(checks: Check[]): Check[] {
  return checks.filter((c) => c.status !== "CLOSED");
}

export function checksInCheckout(checks: Check[]): Check[] {
  return checks.filter((c) => c.status === "IN_CHECKOUT");
}

export function checksWithFiscalError(checks: Check[]): Check[] {
  return checks.filter((c) => c.fiscal?.status === "ERROR");
}

export function outstandingTotal(checks: Check[], orders: Order[]): number {
  return activeChecks(checks).reduce(
    (sum, c) => sum + checkTotal(c, ordersOfCheck(orders, c.id)),
    0,
  );
}

export function activeWaiters(waiters: Waiter[]): Waiter[] {
  return waiters.filter((w) => w.role === "waiter" && w.status === "ACTIVE");
}

export function waiterTableCount(checks: Check[], waiterId: string): number {
  return activeChecks(checks).filter((c) => c.waiterId === waiterId).length;
}

export function waiterStatusMeta(status: WaiterStatus): {
  kind: ChipKind;
  label: string;
} {
  switch (status) {
    case "ACTIVE":
      return { kind: "green", label: "Ativo" };
    case "ON_BREAK":
      return { kind: "amber", label: "Em pausa" };
    default:
      return { kind: "neutral", label: "Inativo" };
  }
}
