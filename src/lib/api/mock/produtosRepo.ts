import type { ProdutosRepo } from "../types";
import { CATEGORIAS, PRODUTOS } from "@/data/produtos";
import { delay } from "@/lib/format";

export const produtosRepo: ProdutosRepo = {
  async list() {
    await delay();
    return PRODUTOS;
  },
  async categories() {
    await delay();
    return CATEGORIAS;
  },
};
