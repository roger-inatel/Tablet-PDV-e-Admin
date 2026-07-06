import type { MesasRepo } from "../types";
import { delay } from "@/lib/format";
import { loadDb } from "./database";

export const mesasRepo: MesasRepo = {
  async list() {
    await delay();
    return loadDb().mesas;
  },
};
