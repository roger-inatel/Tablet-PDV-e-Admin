import type { ChipKind, ComandaItem, ItemStatus, Product, Sector } from "@/types";
import { uid } from "@/lib/format";

// Pure comanda logic shared by the mock repository and the store selectors.
// Keeping it here means the business rules are defined exactly once.

/** Total value of a list of comanda items. */
export function total(items: ComandaItem[]): number {
  return items.reduce((sum, it) => sum + it.price * it.qty, 0);
}

/** Sum of quantities for a given item status. */
export function countByStatus(items: ComandaItem[], status: ItemStatus): number {
  return items
    .filter((it) => it.status === status)
    .reduce((sum, it) => sum + it.qty, 0);
}

/** Pending quantity routed to a given sector. */
export function pendingForSector(items: ComandaItem[], sector: Sector): number {
  return items
    .filter((it) => it.sector === sector && it.status === "PENDENTE")
    .reduce((sum, it) => sum + it.qty, 0);
}

/**
 * Add a product to a comanda. If there is already a PENDENTE line for the same
 * product, bump its quantity; otherwise append a new PENDENTE line.
 */
export function mergeOrAddItem(items: ComandaItem[], product: Product): ComandaItem[] {
  const out = [...items];
  const idx = out.findIndex(
    (it) => it.productId === product.id && it.status === "PENDENTE",
  );
  if (idx >= 0) {
    out[idx] = { ...out[idx], qty: out[idx].qty + 1 };
  } else {
    out.push({
      key: uid(),
      productId: product.id,
      name: product.name,
      price: product.price,
      sector: product.sector,
      qty: 1,
      status: "PENDENTE",
    });
  }
  return out;
}

/** Change quantity of a line by delta; removes the line if it would hit zero. */
export function changeQty(items: ComandaItem[], key: string, delta: 1 | -1): ComandaItem[] {
  return items.flatMap((it) => {
    if (it.key !== key) return [it];
    const qty = it.qty + delta;
    return qty > 0 ? [{ ...it, qty }] : [];
  });
}

/** Status progression for sent items. */
export const ADVANCE_FLOW: Partial<Record<ItemStatus, ItemStatus>> = {
  ENVIADO: "PREPARO",
  PREPARO: "PRONTO",
};

/** Advance a single line to its next preparation status, if any. */
export function advance(items: ComandaItem[], key: string): ComandaItem[] {
  return items.map((it) => {
    const next = ADVANCE_FLOW[it.status];
    return it.key === key && next ? { ...it, status: next } : it;
  });
}

/** Mark all PENDENTE items of a sector as ENVIADO (after confirming print). */
export function sendSector(items: ComandaItem[], sector: Sector): ComandaItem[] {
  return items.map((it) =>
    it.sector === sector && it.status === "PENDENTE"
      ? { ...it, status: "ENVIADO" as ItemStatus }
      : it,
  );
}

/** Chip color + label for an item status. */
export function itemStatusMeta(status: ItemStatus): { kind: ChipKind; label: string } {
  switch (status) {
    case "ENVIADO":
      return { kind: "blue", label: "Enviado" };
    case "PREPARO":
      return { kind: "amber", label: "Em preparo" };
    case "PRONTO":
      return { kind: "green", label: "Pronto" };
    default:
      return { kind: "neutral", label: "A enviar" };
  }
}
