import type { WaitersRepo } from "../types";
import { WAITERS } from "@/data/waiters";
import { delay } from "@/lib/format";

export const waitersRepo: WaitersRepo = {
  async list() {
    await delay();
    return WAITERS;
  },
  async authenticate(waiterId, pin) {
    await delay();
    const w = WAITERS.find((x) => x.id === waiterId);
    return w && w.pin === pin ? w : null;
  },
  async save(waiter) {
    await delay();
    const i = WAITERS.findIndex((w) => w.id === waiter.id);
    if (i >= 0) {
      WAITERS[i] = waiter;
    } else {
      WAITERS.push(waiter);
    }
    return waiter;
  },
};
