import type {
  Category,
  Printer,
  Product,
  Sector,
  Table,
  Waiter,
} from "@/types";

// The repository seam. Today these are implemented against in-memory mock data
// (see ./mock). To connect a NestJS backend later, provide an alternative
// implementation that calls `fetch(...)` and swap the export in ./index.ts.
// Every screen/store depends only on these interfaces — never on raw arrays.

export interface WaitersRepo {
  list(): Promise<Waiter[]>;
  /** Returns the waiter when the PIN matches, otherwise null. */
  authenticate(waiterId: string, pin: string): Promise<Waiter | null>;
  /** Upsert a waiter (create when the id is new). */
  save(waiter: Waiter): Promise<Waiter>;
}

export interface ProductsRepo {
  list(): Promise<Product[]>;
  categories(): Promise<Category[]>;
}

export interface PrintersRepo {
  list(): Promise<Printer[]>;
  /** Simulate sending a test page. */
  test(printerId: string): Promise<void>;
}

export interface TablesRepo {
  list(): Promise<Table[]>;
  get(id: number): Promise<Table | null>;

  // Mutations return the updated table so the store can reconcile its cache.
  open(id: number, waiterId: string): Promise<Table>;
  addItem(id: number, productId: string): Promise<Table>;
  setQty(id: number, key: string, delta: 1 | -1): Promise<Table>;
  advanceItem(id: number, key: string): Promise<Table>;
  sendSector(id: number, sector: Sector): Promise<Table>;
  closeBill(id: number): Promise<Table>;
  setResponsavel(id: number, waiterId: string | null): Promise<Table>;
}

export interface Repos {
  waiters: WaitersRepo;
  products: ProductsRepo;
  printers: PrintersRepo;
  tables: TablesRepo;
}
