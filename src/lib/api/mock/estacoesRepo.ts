import type { EstacoesRepo } from "../types";
import { ESTACOES } from "@/data/estacoes";
import { delay } from "@/lib/format";

export const estacoesRepo: EstacoesRepo = {
  async list() {
    await delay();
    return ESTACOES;
  },
};
