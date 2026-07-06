import type { GarconsRepo } from "../types";
import { delay } from "@/lib/format";
import { loadDb, saveDb } from "./database";

export const garconsRepo: GarconsRepo = {
  async list() {
    await delay();
    return loadDb().garcons;
  },

  async authenticate(garcomId, pin) {
    await delay();
    const g = loadDb().garcons.find((x) => x.id === garcomId);
    return g && g.pin === pin ? g : null;
  },

  async save(garcom) {
    await delay();
    const db = loadDb();
    const idx = db.garcons.findIndex((g) => g.id === garcom.id);
    const garcons =
      idx >= 0
        ? db.garcons.map((g) => (g.id === garcom.id ? garcom : g))
        : [...db.garcons, garcom];
    saveDb({ ...db, garcons });
    return garcom;
  },
};
