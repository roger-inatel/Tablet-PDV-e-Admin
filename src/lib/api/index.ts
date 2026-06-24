import type { Repos } from "./types";
import { waitersRepo } from "./mock/waitersRepo";
import { productsRepo } from "./mock/productsRepo";
import { printersRepo } from "./mock/printersRepo";
import { tablesRepo } from "./mock/tablesRepo";

// The single place that wires concrete implementations to the repository seam.
// Swapping to a NestJS backend = replace these mock repos with HTTP-backed ones
// here. Every consumer imports `repos` and is unaffected by the change.
export const repos: Repos = {
  waiters: waitersRepo,
  products: productsRepo,
  printers: printersRepo,
  tables: tablesRepo,
};

export type { Repos } from "./types";
