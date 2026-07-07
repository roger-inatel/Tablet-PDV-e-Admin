import type {
  Category,
  Check,
  CheckStatus,
  Order,
  OrderItemStatus,
  PaymentMethod,
  Product,
  Station,
  StationConfig,
  Table,
  Waiter,
} from "@/types";

// ---------------------------------------------------------------------------
// The repository seam. Each method maps 1:1 to a NestJS endpoint — see
// docs/CONTRACTS.md. Mutations return updated aggregates; sensitive check
// mutations take `expectedVersion` and throw ConflictError(409) on mismatch.
// Permissions are NOT repo parameters (the backend derives the actor from the
// auth token); the frontend enforces them in store/UI via
// lib/domain/permissions.ts, and the mock repos enforce only state-machine
// invariants (lib/domain/stateMachines.ts).
// ---------------------------------------------------------------------------

export interface WaitersRepo {
  list(): Promise<Waiter[]>;
  /** Returns the waiter when the PIN matches, otherwise null. -> POST /auth/login */
  authenticate(waiterId: string, pin: string): Promise<Waiter | null>;
  /** Upsert (create when the id is new). -> PUT /waiters/:id */
  save(waiter: Waiter): Promise<Waiter>;
}

export interface ProductsRepo {
  list(): Promise<Product[]>;
  categories(): Promise<Category[]>;
}

export interface StationsRepo {
  list(): Promise<StationConfig[]>;
}

export interface TablesRepo {
  /** Tables mutate only through checks (open/close). */
  list(): Promise<Table[]>;
}

export interface ChecksRepo {
  list(filter?: { status?: CheckStatus[] }): Promise<Check[]>;
  get(id: string): Promise<Check | null>;
  /** Claim a free table. -> POST /tables/:id/checks */
  open(tableId: number, waiterId: string): Promise<Check>;
  /** Draft edits (no expectedVersion — drafts are low-stakes). */
  addDraftItem(checkId: string, productId: string): Promise<Check>;
  setDraftQty(checkId: string, key: string, delta: 1 | -1): Promise<Check>;
  /** Dispatch all drafts as one order. -> POST /checks/:id/orders */
  sendOrder(
    checkId: string,
    expectedVersion: number,
  ): Promise<{ check: Check; order: Order }>;
  /** OPEN -> IN_CHECKOUT. -> POST /checks/:id/checkout */
  startCheckout(checkId: string, expectedVersion: number): Promise<Check>;
  /** IN_CHECKOUT -> OPEN (only while payment === null). */
  cancelCheckout(checkId: string): Promise<Check>;
  /** Creates payment + starts async fiscal issuance. `simulateFiscalError` is mock-only. */
  registerPayment(
    checkId: string,
    method: PaymentMethod,
    expectedVersion: number,
    opts?: { simulateFiscalError?: boolean },
  ): Promise<Check>;
  /** Re-run fiscal issuance after ERROR. -> POST /checks/:id/fiscal/retry */
  retryFiscal(checkId: string): Promise<Check>;
  /** Reassign the responsible waiter (manager). -> PATCH /checks/:id/waiter */
  transfer(checkId: string, waiterId: string): Promise<Check>;
}

export interface OrdersRepo {
  list(): Promise<Order[]>;
  listByStation(station: Station): Promise<Order[]>;
  /** Bulk-ack: every SENT item of the station -> RECEIVED. */
  receive(orderId: string, station: Station): Promise<Order>;
  /** Advance one item to the next linear status (422 otherwise). */
  advanceItem(
    orderId: string,
    itemId: string,
    to: OrderItemStatus,
  ): Promise<Order>;
}

export interface Repos {
  waiters: WaitersRepo;
  products: ProductsRepo;
  stations: StationsRepo;
  tables: TablesRepo;
  checks: ChecksRepo;
  orders: OrdersRepo;
}
