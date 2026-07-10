import type { ProductsRepo } from "./types";
import { apiFetch } from "./apiFetch";
import type { Category, Product } from "@/types";

interface CatalogResponse {
  products: Product[];
  categories: Category[];
}

// Both `list()` and `categories()` are fetched together on init (and
// addDraftItem re-reads the list to validate a productId) — share one
// in-flight/resolved request instead of hitting the route twice.
let catalog: Promise<CatalogResponse> | null = null;

function fetchCatalog(): Promise<CatalogResponse> {
  if (!catalog) {
    catalog = apiFetch<CatalogResponse>("/api/products/catalog").catch((e) => {
      catalog = null;
      throw e;
    });
  }
  return catalog;
}

export const productsRepo: ProductsRepo = {
  async list() {
    return (await fetchCatalog()).products;
  },
  async categories() {
    return (await fetchCatalog()).categories;
  },
};
