import type { WaitersRepo } from "../types";
import { delay } from "@/lib/format";
import { loadDb, saveDb } from "./database";

export const waitersRepo: WaitersRepo = {
  async list() {
    await delay();
    return loadDb().waiters;
  },

  async authenticate(waiterId, pin) {
    await delay();
    const w = loadDb().waiters.find((x) => x.id === waiterId);
    return w && w.pin === pin ? w : null;
  },

  async save(waiter) {
    await delay();
    const db = loadDb();
    const idx = db.waiters.findIndex((w) => w.id === waiter.id);
    const waiters =
      idx >= 0
        ? db.waiters.map((w) => (w.id === waiter.id ? waiter : w))
        : [...db.waiters, waiter];
    saveDb({ ...db, waiters });
    return waiter;
  },
};
