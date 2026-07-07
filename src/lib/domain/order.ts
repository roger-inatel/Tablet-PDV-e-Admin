import type {
  Check,
  DraftItem,
  Order,
  OrderItem,
  OrderItemStatus,
  Product,
  Station,
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

/** Charged amount at checkout: dispatched items only (never drafts). */
export function chargedTotal(orders: Order[]): number {
  return orders.reduce((sum, o) => sum + itemsTotal(o.items), 0);
}

/** Displayed running total: drafts + dispatched items. */
export function checkTotal(check: Check, orders: Order[]): number {
  return itemsTotal(check.draftItems) + chargedTotal(orders);
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
  }));
}

// ---- station views ---------------------------------------------------------

export function stationItems(order: Order, station: Station): OrderItem[] {
  return order.items.filter((it) => it.station === station);
}

/** Does this order have anything for the station at all? */
export function belongsToStation(order: Order, station: Station): boolean {
  return order.items.some((it) => it.station === station);
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
