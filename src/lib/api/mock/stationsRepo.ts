import type { StationsRepo } from "../types";
import { STATIONS } from "@/data/stations";
import { delay } from "@/lib/format";

export const stationsRepo: StationsRepo = {
  async list() {
    await delay();
    return STATIONS;
  },
};
