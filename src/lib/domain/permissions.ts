import type { Check, OrderItem, Session, Table } from "@/types";

// Role-based permission predicates. The frontend uses these to gate UI and
// store actions; the NestJS backend implements the SAME rules as guards
// (documented per endpoint in docs/CONTRACTS.md). Pure and unit-testable.

/** Waiters and managers can browse tables; stations cannot. */
export function canViewTables(s: Session | null): boolean {
  return s !== null && s.role !== "station";
}

/** Only a waiter can claim a free table (opening a check). */
export function canOpenCheck(s: Session | null, table: Table): boolean {
  return s?.role === "waiter" && table.checkId === null;
}

/** Is this session the waiter assigned to the check? */
export function isAssignedWaiter(s: Session | null, c: Check): boolean {
  return s?.role === "waiter" && c.waiterId === s.waiterId;
}

/** Any waiter (read-only if not assigned) or manager can view a check. */
export function canViewCheck(s: Session | null): boolean {
  return s?.role === "waiter" || s?.role === "manager";
}

/** Draft edits (add/inc/dec items): assigned waiter, check OPEN. */
export function canEditDraft(s: Session | null, c: Check): boolean {
  return isAssignedWaiter(s, c) && c.status === "OPEN";
}

/** Dispatch pending drafts as an order. */
export function canSendOrder(s: Session | null, c: Check): boolean {
  return (
    isAssignedWaiter(s, c) && c.status === "OPEN" && c.draftItems.length > 0
  );
}

/** Start checkout: assigned waiter OR manager (cashier), no pending drafts. */
export function canStartCheckout(s: Session | null, c: Check): boolean {
  const actor = isAssignedWaiter(s, c) || s?.role === "manager";
  return actor && c.status === "OPEN" && c.draftItems.length === 0;
}

export function canRegisterPayment(s: Session | null, c: Check): boolean {
  const actor = isAssignedWaiter(s, c) || s?.role === "manager";
  return actor && c.status === "IN_CHECKOUT" && c.payment === null;
}

export function canCancelCheckout(s: Session | null, c: Check): boolean {
  const actor = isAssignedWaiter(s, c) || s?.role === "manager";
  return actor && c.status === "IN_CHECKOUT" && c.payment === null;
}

/** Fiscal retry is a manager/cashier operation. */
export function canRetryFiscal(s: Session | null, c: Check): boolean {
  return s?.role === "manager" && c.fiscal?.status === "ERROR";
}

/** Reassigning the responsible waiter is a manager operation. */
export function canTransferCheck(s: Session | null): boolean {
  return s?.role === "manager";
}

/** KDS: a station may only advance items routed to itself. */
export function canAdvanceItem(s: Session | null, item: OrderItem): boolean {
  return s?.role === "station" && item.station === s.station;
}
