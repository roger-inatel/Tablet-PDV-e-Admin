import type { Category, Estacao, Produto } from "@/types";

// v2 menu seed — same 20 products, `sector` renamed to `estacao`.
export const CATEGORIAS: Category[] = [
  "Entradas",
  "Pratos",
  "Sobremesas",
  "Bebidas",
  "Bar",
];

// [name, category, estacao, price]
const RAW: [string, Category, Estacao, number][] = [
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

export const PRODUTOS: Produto[] = RAW.map(
  ([name, category, estacao, price], i) => ({
    id: "pr" + i,
    name,
    category,
    estacao,
    price,
  }),
);

export const PRODUTO_BY_ID: Record<string, Produto> = PRODUTOS.reduce(
  (acc, p) => {
    acc[p.id] = p;
    return acc;
  },
  {} as Record<string, Produto>,
);
