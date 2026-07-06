import type { EstacaoConfig } from "@/types";

// Preparation stations (KDS tablets) — replaces the printers seed.
export const ESTACOES: EstacaoConfig[] = [
  {
    id: "cozinha",
    nome: "Cozinha",
    descricao: "Entradas, pratos e sobremesas",
    cor: "#b45309",
    icone: "flame",
    categorias: ["Entradas", "Pratos", "Sobremesas"],
  },
  {
    id: "bar",
    nome: "Bar",
    descricao: "Bebidas, drinks e cervejas",
    cor: "#2563eb",
    icone: "wine",
    categorias: ["Bebidas", "Bar"],
  },
];
