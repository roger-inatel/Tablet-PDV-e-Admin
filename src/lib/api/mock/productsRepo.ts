import type { ProductsRepo } from "../types";
import { CATEGORIES, PRODUCTS } from "@/data/products";
import { delay } from "@/lib/format";

export const productsRepo: ProductsRepo = {
  async list() {
    await delay();
    return PRODUCTS;
  },
  async categories() {
    await delay();
    return CATEGORIES;
  },
};
