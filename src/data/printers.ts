import type { Printer } from "@/types";

// Seed impressoras / setores (ported verbatim from the imported design).
export const PRINTERS: Printer[] = [
  {
    id: "pr1",
    name: "Cozinha 01",
    sector: "cozinha",
    location: "Cozinha quente",
    model: "Epson TM-T20",
    status: "ONLINE",
  },
  {
    id: "pr2",
    name: "Bar 01",
    sector: "bar",
    location: "Balcão do bar",
    model: "Bematech MP-4200",
    status: "ONLINE",
  },
  {
    id: "pr3",
    name: "Caixa / Conta",
    sector: "caixa",
    location: "Frente de caixa",
    model: "Elgin i9",
    status: "OFFLINE",
  },
];
