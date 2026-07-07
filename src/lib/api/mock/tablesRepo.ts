import type { TablesRepo } from "../types";
import { delay } from "@/lib/format";
import { loadDb } from "./database";

export const tablesRepo: TablesRepo = {
  async list() {
    await delay();
    return loadDb().tables;
  },
};
