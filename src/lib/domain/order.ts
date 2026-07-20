import type {
  AdjustmentKind,
  Check,
  DraftItem,
  Order,
  OrderItem,
  OrderItemStatus,
  OrderPriority,
  Product,
  Station,
  TenderInput,
} from "@/types";
import { uid } from "@/lib/format";

// Pure logic for drafts, orders and money. Shared by the mock repos and the
// UI selectors; the invariants here are part of the backend contract.

// ---- money -----------------------------------------------------------------

export function itemsTotal(
  items: { unitPrice: number; qty: number }[],
): number {
  return items.reduce((sum, it) => sum + it.unitPrice * it.qty, 0);
}

/** Non-voided items of an order (approved removals are excluded everywhere). */
export function activeItems(order: Order): OrderItem[] {
  return order.items.filter((it) => !it.voided);
}

/** Charged amount at checkout: dispatched, non-voided items only (never drafts). */
export function chargedTotal(orders: Order[]): number {
  return orders.reduce((sum, o) => sum + itemsTotal(activeItems(o)), 0);
}

/** Displayed running total: drafts + dispatched items. */
export function checkTotal(check: Check, orders: Order[]): number {
  return itemsTotal(check.draftItems) + chargedTotal(orders);
}

// ---- settlement (cashier: discount / service fee / split tenders) -----------

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Absolute discount from a value/percent input, clamped to [0, subtotal]. */
export function computeDiscount(
  subtotal: number,
  kind: AdjustmentKind,
  input: number,
): number {
  const raw = kind === "percent" ? (subtotal * input) / 100 : input;
  return round2(Math.min(Math.max(0, raw), subtotal));
}

/** Absolute service fee from a value/percent input over the base (subtotal). */
export function computeServiceFee(
  base: number,
  kind: AdjustmentKind,
  input: number,
): number {
  const raw = kind === "percent" ? (base * input) / 100 : input;
  return round2(Math.max(0, raw));
}

/** Amount actually charged: subtotal minus discount plus service fee. */
export function settlementTotal(
  subtotal: number,
  discount: number,
  serviceFee: number,
): number {
  return round2(Math.max(0, subtotal - discount + serviceFee));
}

export function tendersPaid(tenders: { amount: number }[]): number {
  return round2(tenders.reduce((sum, t) => sum + (t.amount || 0), 0));
}

/** Change due (troco) — only ever positive when overpaid, always in cash. */
export function computeChange(
  total: number,
  tenders: { amount: number }[],
): number {
  return round2(Math.max(0, tendersPaid(tenders) - total));
}

/**
 * Validates a settlement before charging. Overpayment is allowed only in cash
 * (non-cash tenders must not exceed the total), every tender must be positive,
 * and the total tendered must cover the bill.
 */
export function validateSettlement(
  total: number,
  tenders: TenderInput[],
): { ok: boolean; reason?: string } {
  if (tenders.length === 0) {
    return { ok: false, reason: "Adicione ao menos uma forma de pagamento" };
  }
  if (tenders.some((t) => !(t.amount > 0))) {
    return { ok: false, reason: "Todos os valores devem ser maiores que zero" };
  }
  const paid = tendersPaid(tenders);
  if (paid + 1e-6 < total) {
    return { ok: false, reason: "Valor recebido menor que o total" };
  }
  const nonCash = tendersPaid(tenders.filter((t) => t.method !== "cash"));
  if (nonCash > total + 1e-6) {
    return { ok: false, reason: "Troco somente em dinheiro" };
  }
  return { ok: true };
}

// ---- drafts ----------------------------------------------------------------

/** Merge a product into the drafts (same product bumps qty). */
export function mergeDraft(drafts: DraftItem[], product: Product): DraftItem[] {
  const idx = drafts.findIndex((d) => d.productId === product.id);
  if (idx >= 0) {
    return drafts.map((d, i) => (i === idx ? { ...d, qty: d.qty + 1 } : d));
  }
  return [
    ...drafts,
    {
      key: uid(),
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      station: product.station,
      qty: 1,
    },
  ];
}

/** Change a draft's qty by delta; removes the line at zero. */
export function changeDraftQty(
  drafts: DraftItem[],
  key: string,
  delta: 1 | -1,
): DraftItem[] {
  return drafts.flatMap((d) => {
    if (d.key !== key) return [d];
    const qty = d.qty + delta;
    return qty > 0 ? [{ ...d, qty }] : [];
  });
}

/** Turn the current drafts into the items of a new order (status SENT). */
export function draftsToOrderItems(drafts: DraftItem[]): OrderItem[] {
  return drafts.map((d) => ({
    id: uid(),
    productId: d.productId,
    name: d.name,
    unitPrice: d.unitPrice,
    station: d.station,
    qty: d.qty,
    status: "SENT" as OrderItemStatus,
    notes: d.notes?.trim() || undefined,
  }));
}

/** Set/replace the note of a draft line by key. */
export function setDraftNote(
  drafts: DraftItem[],
  key: string,
  notes: string,
): DraftItem[] {
  const trimmed = notes.trim();
  return drafts.map((d) =>
    d.key === key ? { ...d, notes: trimmed || undefined } : d,
  );
}

/** Priority rank for sorting (higher = more urgent). */
export function priorityRank(priority: OrderPriority | undefined): number {
  switch (priority) {
    case "urgente":
      return 2;
    case "alta":
      return 1;
    default:
      return 0;
  }
}

// ---- station views ---------------------------------------------------------

export function stationItems(order: Order, station: Station): OrderItem[] {
  return order.items.filter((it) => it.station === station && !it.voided);
}

/** Does this order have any active item for the station at all? */
export function belongsToStation(order: Order, station: Station): boolean {
  return order.items.some((it) => it.station === station && !it.voided);
}

/** Is every (non-voided) item of the order ready to be delivered? */
export function isOrderReady(order: Order): boolean {
  const items = activeItems(order);
  return items.length > 0 && items.every((it) => it.status === "READY");
}

/**
 * When this station finished the order — the most recent `readyAt` among its
 * active items. Drives the "Pronto" column, where the freshest plate matters
 * more than the oldest. Falls back to `createdAt` for legacy rows.
 */
export function stationReadyAt(order: Order, station: Station): number {
  const times = stationItems(order, station)
    .map((it) => (it.readyAt ? new Date(it.readyAt).getTime() : 0))
    .filter((t) => t > 0);
  return times.length > 0
    ? Math.max(...times)
    : new Date(order.createdAt).getTime();
}

/**
 * KDS card stage for a station = the least-advanced status among its items
 * (a card leaves "Recebido" only when every item has moved on).
 */
export function stationStage(
  order: Order,
  station: Station,
): OrderItemStatus | null {
  const flow: OrderItemStatus[] = ["SENT", "RECEIVED", "PREPARING", "READY"];
  const items = stationItems(order, station);
  if (items.length === 0) return null;
  let min = flow.length - 1;
  for (const it of items) {
    min = Math.min(min, flow.indexOf(it.status));
  }
  return flow[min];
}
