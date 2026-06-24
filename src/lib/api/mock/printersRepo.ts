import type { PrintersRepo } from "../types";
import { PRINTERS } from "@/data/printers";
import { delay } from "@/lib/format";

export const printersRepo: PrintersRepo = {
  async list() {
    await delay();
    return PRINTERS;
  },
  async test() {
    // No real printing — just simulate the round-trip.
    await delay();
  },
};
