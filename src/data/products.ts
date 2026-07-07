import type { Category, Product, Station } from "@/types";

// Menu seed. Category values and product names are user-facing content (pt-BR).
export const CATEGORIES: Category[] = [
  "Entradas",
  "Pratos",
  "Sobremesas",
  "Bebidas",
  "Bar",
];

// [name, category, station, price]
const RAW: [string, Category, Station, number][] = [
  ["Bruschetta", "Entradas", "kitchen", 24],
  ["Bolinho de bacalhau", "Entradas", "kitchen", 32],
  ["Carpaccio", "Entradas", "kitchen", 38],
  ["Tábua de frios", "Entradas", "kitchen", 56],
  ["Filé à parmegiana", "Pratos", "kitchen", 62],
  ["Risoto de camarão", "Pratos", "kitchen", 74],
  ["Picanha na brasa", "Pratos", "kitchen", 89],
  ["Moqueca de peixe", "Pratos", "kitchen", 78],
  ["Petit gateau", "Sobremesas", "kitchen", 28],
  ["Pudim de leite", "Sobremesas", "kitchen", 18],
  ["Cheesecake", "Sobremesas", "kitchen", 26],
  ["Sorvete (2 bolas)", "Sobremesas", "kitchen", 16],
  ["Suco natural", "Bebidas", "bar", 14],
  ["Refrigerante lata", "Bebidas", "bar", 8],
  ["Água mineral", "Bebidas", "bar", 6],
  ["Água com gás", "Bebidas", "bar", 7],
  ["Chopp 500ml", "Bar", "bar", 16],
  ["Caipirinha", "Bar", "bar", 28],
  ["Gin tônica", "Bar", "bar", 34],
  ["Vinho (taça)", "Bar", "bar", 32],
];

export const PRODUCTS: Product[] = RAW.map(
  ([name, category, station, price], i) => ({
    id: "pr" + i,
    name,
    category,
    station,
    price,
  }),
);

export const PRODUCT_BY_ID: Record<string, Product> = PRODUCTS.reduce(
  (acc, p) => {
    acc[p.id] = p;
    return acc;
  },
  {} as Record<string, Product>,
);
