import type { Repos } from "./types";
import { waitersRepo } from "./mock/waitersRepo";
import { productsRepo } from "./productsRepo";
import { stationsRepo } from "./mock/stationsRepo";
import { tablesRepo } from "./mock/tablesRepo";
import { checksRepo } from "./mock/checksRepo";
import { ordersRepo } from "./mock/ordersRepo";
import { removalsRepo } from "./mock/removalsRepo";

// The single place that wires concrete implementations to the repository seam.
// Swapping to the NestJS backend = replace the mock repos with HTTP-backed
// implementations here (fetch + WebSocket/SSE realtime). Every consumer
// imports `repos` and is unaffected by the change. See docs/CONTRACTS.md.
export const repos: Repos = {
  waiters: waitersRepo,
  products: productsRepo,
  stations: stationsRepo,
  tables: tablesRepo,
  checks: checksRepo,
  orders: ordersRepo,
  removals: removalsRepo,
};

export type { Repos } from "./types";
export * from "./errors";
