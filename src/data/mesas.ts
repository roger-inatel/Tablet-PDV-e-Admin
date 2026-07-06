import type { Mesa } from "@/types";

// v2 mesas seed. Occupancy comes from comandaId (see data/comandas.ts —
// the ids must stay in sync with seedComandas).
const SEATS = [4, 4, 2, 6, 2, 4, 4, 6, 2, 4, 8, 4];

const COMANDA_BY_MESA: Record<number, string> = {
  2: "c-m2",
  3: "c-m3",
  4: "c-m4",
  6: "c-m6",
  7: "c-m7",
  8: "c-m8",
  10: "c-m10",
  11: "c-m11",
};

export function seedMesas(): Mesa[] {
  return SEATS.map((seats, i) => {
    const num = i + 1;
    return {
      id: num,
      num,
      seats,
      comandaId: COMANDA_BY_MESA[num] ?? null,
    };
  });
}
