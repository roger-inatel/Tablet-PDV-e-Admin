// Domain model for the Mesa+ restaurant POS.
// Table ≠ Check ≠ Order ≠ OrderItem; role-based sessions; payment closes the check.
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
export type PaymentMethod = "cash" | "card" | "pix";

/** KDS order priority — drives sorting and the priority badge. */
export type OrderPriority = "normal" | "alta" | "urgente";

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
  /** ERP seller code (RL_EMPRESA_VENDEDOR.COD_VEND) for revenue attribution. */
  codVend?: number;
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
  /** Free-text observation for the kitchen/bar (e.g. "sem cebola"). */
  notes?: string;
}

export interface Payment {
  id: string;
  method: PaymentMethod;
  amount: number;
  createdAt: string; // ISO
}

/** How a discount/service-fee value was entered by the cashier. */
export type AdjustmentKind = "value" | "percent";

/** One tender in a (possibly split) settlement. */
export interface Tender {
  id: string;
  method: PaymentMethod;
  amount: number;
  createdAt: string; // ISO
}

/**
 * Full financial breakdown of a paid check (the cashier's work). `payment`
 * stays as a backward-compatible summary; `settlement` carries the detail.
 */
export interface Settlement {
  id: string;
  subtotal: number; // = chargedTotal(orders)
  discount: number; // absolute R$ applied (>= 0)
  discountKind?: AdjustmentKind;
  discountInput?: number; // raw operator input (10 => R$10 or 10%)
  serviceFee: number; // absolute R$ (taxa de serviço)
  serviceFeeKind?: AdjustmentKind;
  serviceFeeInput?: number;
  total: number; // subtotal - discount + serviceFee
  tenders: Tender[]; // 1..n
  paid: number; // sum(tenders)
  changeDue: number; // troco = max(0, paid - total), cash-only
  createdAt: string; // ISO
}

/** One tender as entered by the cashier (before ids/timestamps). */
export interface TenderInput {
  method: PaymentMethod;
  amount: number;
}

/** Cashier input to register a payment (discount/fee already resolved to R$). */
export interface RegisterPaymentInput {
  discount?: number;
  discountKind?: AdjustmentKind;
  discountInput?: number;
  serviceFee?: number;
  serviceFeeKind?: AdjustmentKind;
  serviceFeeInput?: number;
  tenders: TenderInput[];
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
  /** Full financial breakdown (absent until paid; legacy seeds may lack it). */
  settlement?: Settlement | null;
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
  /** Free-text observation shown on the KDS card. */
  notes?: string;
  receivedAt?: string;
  startedAt?: string;
  readyAt?: string;
  /** Set when a manager-approved removal voids the line (kept for audit). */
  voided?: boolean;
  voidedAt?: string;
}

/** Lifecycle of a waiter's item-removal request. */
export type RemovalStatus = "PENDING" | "APPROVED" | "REJECTED";

/**
 * A waiter's request to remove a dispatched item. Approval voids the item and
 * the record is kept forever (audit). The waiter never removes items directly.
 */
export interface RemovalRequest {
  id: string;
  checkId: string;
  tableNum: number;
  orderId: string;
  orderItemId: string;
  productId: string;
  itemName: string;
  qty: number;
  unitPrice: number;
  amount: number; // unitPrice * qty
  reason: string; // motivo informado pelo garçom
  status: RemovalStatus;
  requestedByWaiterId: string; // solicitante
  requestedAt: string; // ISO
  decidedByManagerId?: string; // gerente responsável
  decidedAt?: string; // ISO
  decisionNote?: string;
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
  /** KDS priority (defaults to "normal" when absent). */
  priority?: OrderPriority;
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
