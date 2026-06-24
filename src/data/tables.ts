import type { ComandaItem, ItemStatus, Table, TableStatus } from "@/types";
import { uid } from "@/lib/format";
import { PRODUCT_BY_NAME } from "./products";

function mkItem(name: string, qty: number, status: ItemStatus): ComandaItem {
  const p = PRODUCT_BY_NAME[name];
  return {
    key: uid(),
    productId: p.id,
    name: p.name,
    price: p.price,
    sector: p.sector,
    qty,
    status,
  };
}

// [num, seats, status, waiterId, items[[name, qty, status]]]
// Ported verbatim from the imported design's seed (12 tables).
type RawTable = [number, number, TableStatus, string | null, [string, number, ItemStatus][]];

const RAW: RawTable[] = [
  [1, 4, "livre", null, []],
  [
    2,
    4,
    "ocupada",
    "carlos",
    [
      ["Bruschetta", 2, "PREPARO"],
      ["Picanha na brasa", 1, "ENVIADO"],
      ["Chopp 500ml", 2, "PRONTO"],
    ],
  ],
  [3, 2, "ocupada", "marina", [["Filé à parmegiana", 1, "ENVIADO"]]],
  [
    4,
    6,
    "ocupada",
    "carlos",
    [
      ["Risoto de camarão", 1, "PENDENTE"],
      ["Caipirinha", 1, "PENDENTE"],
    ],
  ],
  [5, 2, "livre", null, []],
  [6, 4, "ocupada", "bruno", [["Moqueca de peixe", 1, "PREPARO"]]],
  [
    7,
    4,
    "ocupada",
    "carlos",
    [
      ["Filé à parmegiana", 1, "ENVIADO"],
      ["Suco natural", 2, "ENVIADO"],
    ],
  ],
  [8, 6, "ocupada", "marina", [["Tábua de frios", 1, "PRONTO"]]],
  [9, 2, "livre", null, []],
  [10, 4, "ocupada", "julia", [["Gin tônica", 2, "ENVIADO"]]],
  [
    11,
    8,
    "ocupada",
    "carlos",
    [
      ["Tábua de frios", 1, "PRONTO"],
      ["Vinho (taça)", 2, "PRONTO"],
      ["Picanha na brasa", 2, "PREPARO"],
    ],
  ],
  [12, 4, "livre", null, []],
];

export function seedTables(): Table[] {
  return RAW.map(([num, seats, status, waiterId, items]) => ({
    id: num,
    num,
    seats,
    status,
    waiterId,
    items: items.map(([name, qty, st]) => mkItem(name, qty, st)),
  }));
}
