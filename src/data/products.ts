import type { Category, Product, Sector } from "@/types";

// Category display order (drives the catalog / produtos tabs).
export const CATEGORIES: Category[] = [
  "Entradas",
  "Pratos",
  "Sobremesas",
  "Bebidas",
  "Bar",
];

// [name, category, sector, price] — ported verbatim from the imported design.
const RAW: [string, Category, Sector, number][] = [
  ["Bruschetta", "Entradas", "cozinha", 24],
  ["Bolinho de bacalhau", "Entradas", "cozinha", 32],
  ["Carpaccio", "Entradas", "cozinha", 38],
  ["Tábua de frios", "Entradas", "cozinha", 56],
  ["Filé à parmegiana", "Pratos", "cozinha", 62],
  ["Risoto de camarão", "Pratos", "cozinha", 74],
  ["Picanha na brasa", "Pratos", "cozinha", 89],
  ["Moqueca de peixe", "Pratos", "cozinha", 78],
  ["Petit gateau", "Sobremesas", "cozinha", 28],
  ["Pudim de leite", "Sobremesas", "cozinha", 18],
  ["Cheesecake", "Sobremesas", "cozinha", 26],
  ["Sorvete (2 bolas)", "Sobremesas", "cozinha", 16],
  ["Suco natural", "Bebidas", "bar", 14],
  ["Refrigerante lata", "Bebidas", "bar", 8],
  ["Água mineral", "Bebidas", "bar", 6],
  ["Água com gás", "Bebidas", "bar", 7],
  ["Chopp 500ml", "Bar", "bar", 16],
  ["Caipirinha", "Bar", "bar", 28],
  ["Gin tônica", "Bar", "bar", 34],
  ["Vinho (taça)", "Bar", "bar", 32],
];

export const PRODUCTS: Product[] = RAW.map(([name, category, sector, price], i) => ({
  id: "pr" + i,
  name,
  category,
  sector,
  price,
}));

/** Lookup table by product name (used when seeding comanda items). */
export const PRODUCT_BY_NAME: Record<string, Product> = PRODUCTS.reduce(
  (acc, p) => {
    acc[p.name] = p;
    return acc;
  },
  {} as Record<string, Product>,
);
