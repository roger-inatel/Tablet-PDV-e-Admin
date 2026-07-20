import type {
  Category,
  Check,
  CheckStatus,
  Order,
  OrderItemStatus,
  OrderPriority,
  Product,
  RegisterPaymentInput,
  RemovalRequest,
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
  /** Set a kitchen/bar observation on a draft line. */
  setDraftItemNote(checkId: string, key: string, notes: string): Promise<Check>;
  /** Dispatch all drafts as one order (with optional priority). -> POST /checks/:id/orders */
  sendOrder(
    checkId: string,
    expectedVersion: number,
    opts?: { priority?: OrderPriority },
  ): Promise<{ check: Check; order: Order }>;
  /** OPEN -> IN_CHECKOUT. -> POST /checks/:id/checkout */
  startCheckout(checkId: string, expectedVersion: number): Promise<Check>;
  /** IN_CHECKOUT -> OPEN (only while payment === null). */
  cancelCheckout(checkId: string): Promise<Check>;
  /** Registers payment (settlement) and closes the check (frees the table). */
  registerPayment(
    checkId: string,
    input: RegisterPaymentInput,
    expectedVersion: number,
  ): Promise<Check>;
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

export interface RemovalsRepo {
  list(): Promise<RemovalRequest[]>;
  /** Waiter requests removal of a dispatched item. -> POST /removals */
  request(
    orderId: string,
    orderItemId: string,
    reason: string,
    waiterId: string,
  ): Promise<RemovalRequest>;
  /** Manager approves: voids the item + closes the audit record. -> POST /removals/:id/approve */
  approve(
    id: string,
    managerId: string,
    note?: string,
  ): Promise<{ removal: RemovalRequest; order: Order }>;
  /** Manager rejects: audit record only. -> POST /removals/:id/reject */
  reject(id: string, managerId: string, note?: string): Promise<RemovalRequest>;
}

export interface Repos {
  waiters: WaitersRepo;
  products: ProductsRepo;
  stations: StationsRepo;
  tables: TablesRepo;
  checks: ChecksRepo;
  orders: OrdersRepo;
  removals: RemovalsRepo;
}
