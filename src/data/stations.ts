import type { StationConfig } from "@/types";

// Preparation stations (KDS tablets). Display strings stay in pt-BR.
export const STATIONS: StationConfig[] = [
  {
    id: "kitchen",
    name: "Cozinha",
    description: "Entradas, pratos e sobremesas",
    color: "#b45309",
    icon: "flame",
    categories: ["Entradas", "Pratos", "Sobremesas"],
  },
  {
    id: "bar",
    name: "Bar",
    description: "Bebidas, drinks e cervejas",
    color: "#2563eb",
    icon: "wine",
    categories: ["Bebidas", "Bar"],
  },
];
