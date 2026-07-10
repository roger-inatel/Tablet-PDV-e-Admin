// Domain model for the Mesa+ restaurant POS.
// Table ≠ Check ≠ Order ≠ OrderItem; role-based sessions; async fiscal closing.
// All identifiers in English; user-facing labels stay in pt-BR at the UI layer.
// These shapes are the contract the NestJS backend implements (docs/CONTRACTS.md).

/** Menu category — sourced from TB_CATEGORIA (DS_CATEGORIA). */
export type Category = string;

/** Preparation station (KDS). */
export type Station = "kitchen" | "bar";

/** Authenticated role of a session. */
export type Role = "waiter" | "manager" | "station";

export type WaiterStatus = "ACTIVE" | "ON_BREAK" | "INACTIVE";
export type CheckStatus = "OPEN" | "IN_CHECKOUT" | "CLOSED";
export type OrderItemStatus = "SENT" | "RECEIVED" | "PREPARING" | "READY";
export type FiscalStatus = "PROCESSING" | "ISSUED" | "ERROR";
export type PaymentMethod = "cash" | "card" | "pix";

/** A table. Occupancy is DERIVED: checkId !== null means occupied. */
export interface Table {
  id: number;
  num: number;
  seats: number;
  checkId: string | null;
}

/** Staff member (waiter or manager). */
export interface Waiter {
  id: string;
  name: string;
  initials: string;
  /** Avatar background color (hex). */
  color: string;
  login: string;
  pin: string;
  /** Auth role used by permission logic. */
  role: "waiter" | "manager";
  /** Display label shown in the UI ("Garçom", "Garçonete", "Gerente"). */
  roleLabel: string;
  status: WaiterStatus;
  phone?: string;
  note?: string;
}

/** Menu product. `station` defines KDS routing. */
export interface Product {
  id: string;
  name: string;
  category: Category;
  station: Station;
  price: number;
}

/** Station configuration (the /admin/stations entity; KDS chrome). */
export interface StationConfig {
  id: Station;
  /** Display name shown in the UI (pt-BR). */
  name: string;
  description: string;
  /** Accent color (hex) for KDS chrome / chips. */
  color: string;
  icon: "flame" | "wine";
  /** Which menu categories route to this station. */
  categories: Category[];
}

/** Draft line on an open check — not yet dispatched (no status field). */
export interface DraftItem {
  key: string;
  productId: string;
  name: string;
  unitPrice: number;
  station: Station;
  qty: number;
}

export interface Payment {
  id: string;
  method: PaymentMethod;
  amount: number;
  createdAt: string; // ISO
}

/** Fiscal emission sub-state (only meaningful after payment is created). */
export interface Fiscal {
  status: FiscalStatus;
  attempts: number;
  errorMsg?: string;
  issuedAt?: string; // ISO
  /** Mock NFC-e access key. */
  accessKey?: string;
}

/**
 * The bill of a table. Owns the assigned waiter, the pre-send drafts and the
 * closing lifecycle. `version` bumps on EVERY mutation (optimistic
 * concurrency; sensitive mutations require expectedVersion).
 */
export interface Check {
  id: string;
  tableId: number;
  /** Denormalized for list rendering. */
  tableNum: number;
  waiterId: string;
  status: CheckStatus;
  version: number;
  draftItems: DraftItem[];
  payment: Payment | null;
  fiscal: Fiscal | null;
  openedAt: string; // ISO
  closedAt: string | null;
}

/** A line of a dispatched order, advanced only by its station's KDS. */
export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  unitPrice: number;
  station: Station;
  qty: number;
  status: OrderItemStatus;
  receivedAt?: string;
  startedAt?: string;
  readyAt?: string;
}

/** One dispatched batch. May contain items for both stations; KDS filters. */
export interface Order {
  id: string;
  checkId: string;
  /** Denormalized for KDS cards. */
  tableId: number;
  tableNum: number;
  waiterId: string;
  /** Sequential within the check ("Pedido #2" in the UI). */
  seq: number;
  createdAt: string; // ISO
  items: OrderItem[];
}

/** Client session — one per browser tab (persisted in sessionStorage). */
export type Session =
  | { role: "waiter"; waiterId: string }
  | { role: "manager"; waiterId: string }
  | { role: "station"; station: Station };

/** UI layout preferences (persisted). */
export type TablesVariant = "detailed" | "compact";
export type CheckVariant = "split" | "focus";

/** Semantic color used by status chips. */
export type ChipKind = "green" | "amber" | "red" | "blue" | "neutral";
