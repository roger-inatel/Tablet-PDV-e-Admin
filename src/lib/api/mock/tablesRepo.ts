import type { Table } from "@/types";
import type { TablesRepo } from "../types";
import { PRODUCTS } from "@/data/products";
import { delay } from "@/lib/format";
import {
  advance,
  changeQty,
  mergeOrAddItem,
  sendSector as sendSectorItems,
} from "@/lib/domain/comanda";
import { getTables, setTables } from "./db";

/** Apply an immutable update to one table and persist; returns the updated row. */
function update(id: number, fn: (t: Table) => Table): Table {
  let updated: Table | null = null;
  const next = getTables().map((t) => {
    if (t.id !== id) return t;
    updated = fn(t);
    return updated;
  });
  if (!updated) throw new Error(`Mesa ${id} não encontrada`);
  setTables(next);
  return updated;
}

export const tablesRepo: TablesRepo = {
  async list() {
    await delay();
    return getTables();
  },
  async get(id) {
    await delay();
    return getTables().find((t) => t.id === id) ?? null;
  },

  async open(id, waiterId) {
    await delay();
    return update(id, (t) =>
      t.status === "livre"
        ? { ...t, status: "ocupada", waiterId, items: t.items ?? [] }
        : t,
    );
  },

  async addItem(id, productId) {
    await delay();
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) throw new Error("Produto não encontrado");
    return update(id, (t) => ({ ...t, items: mergeOrAddItem(t.items, product) }));
  },

  async setQty(id, key, deltaSign) {
    await delay();
    return update(id, (t) => ({ ...t, items: changeQty(t.items, key, deltaSign) }));
  },

  async advanceItem(id, key) {
    await delay();
    return update(id, (t) => ({ ...t, items: advance(t.items, key) }));
  },

  async sendSector(id, sector) {
    await delay();
    return update(id, (t) => ({ ...t, items: sendSectorItems(t.items, sector) }));
  },

  async closeBill(id) {
    await delay();
    return update(id, (t) => ({ ...t, status: "livre", waiterId: null, items: [] }));
  },

  async setResponsavel(id, waiterId) {
    await delay();
    return update(id, (t) => ({ ...t, waiterId: waiterId || null }));
  },
};
