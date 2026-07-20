import type {
  Check,
  CheckStatus,
  OrderItem,
  OrderItemStatus,
  RemovalRequest,
} from "@/types";
import { ConflictError, InvalidTransitionError } from "@/lib/api/errors";

// State machines of the domain. Enforced by the mock repos and exported to
// docs/CONTRACTS.md — the NestJS backend must implement these exact tables.

/** Check lifecycle. IN_CHECKOUT -> OPEN only via cancelCheckout
 *  (and only while payment === null — enforced at the domain assertion). */
export const CHECK_TRANSITIONS: Record<CheckStatus, CheckStatus[]> = {
  OPEN: ["IN_CHECKOUT"],
  IN_CHECKOUT: ["OPEN", "CLOSED"],
  CLOSED: [],
};

/** Strictly linear item flow, advanced only by the item's station KDS. */
export const ORDER_ITEM_FLOW: OrderItemStatus[] = [
  "SENT",
  "RECEIVED",
  "PREPARING",
  "READY",
];

export function nextItemStatus(
  current: OrderItemStatus,
): OrderItemStatus | null {
  const i = ORDER_ITEM_FLOW.indexOf(current);
  return ORDER_ITEM_FLOW[i + 1] ?? null;
}

export function assertCheckTransition(
  from: CheckStatus,
  to: CheckStatus,
): void {
  if (!CHECK_TRANSITIONS[from].includes(to)) {
    throw new InvalidTransitionError("Comanda", from, to);
  }
}

export function assertItemTransition(
  from: OrderItemStatus,
  to: OrderItemStatus,
): void {
  if (nextItemStatus(from) !== to) {
    throw new InvalidTransitionError("Item do pedido", from, to);
  }
}

/** Optimistic-concurrency check for sensitive check mutations. */
export function assertVersion(check: Check, expectedVersion: number): void {
  if (check.version !== expectedVersion) {
    throw new ConflictError(`Comanda ${check.id}`, expectedVersion, check.version);
  }
}

/** Guards beyond pure status transitions (documented in CONTRACTS.md). */
export function assertCanEdit(check: Check): void {
  if (check.status !== "OPEN") {
    throw new InvalidTransitionError("Comanda", check.status, "edição de itens");
  }
}

export function assertCanStartCheckout(check: Check): void {
  assertCheckTransition(check.status, "IN_CHECKOUT");
  if (check.draftItems.length > 0) {
    throw new InvalidTransitionError(
      "Comanda",
      "com itens não enviados",
      "fechamento",
    );
  }
}

export function assertCanCancelCheckout(check: Check): void {
  assertCheckTransition(check.status, "OPEN");
  if (check.payment !== null) {
    throw new InvalidTransitionError(
      "Comanda",
      "fechamento com pagamento",
      "reabrir",
    );
  }
}

export function assertCanRegisterPayment(check: Check): void {
  if (check.status !== "IN_CHECKOUT" || check.payment !== null) {
    throw new InvalidTransitionError(
      "Comanda",
      check.status,
      "registrar pagamento",
    );
  }
}

/** A removal can only be requested on an open check for a non-voided item
 *  without an already-pending request. */
export function assertCanRequestRemoval(
  check: Check,
  item: OrderItem,
  hasPending: boolean,
): void {
  if (check.status !== "OPEN") {
    throw new InvalidTransitionError("Comanda", check.status, "solicitar remoção");
  }
  if (item.voided) {
    throw new InvalidTransitionError("Item", "removido", "solicitar remoção");
  }
  if (hasPending) {
    throw new InvalidTransitionError("Item", "com remoção pendente", "solicitar remoção");
  }
}

/** A removal decision (approve/reject) is only valid while it is pending. */
export function assertCanDecideRemoval(removal: RemovalRequest): void {
  if (removal.status !== "PENDING") {
    throw new InvalidTransitionError("Remoção", removal.status, "decidir");
  }
}
