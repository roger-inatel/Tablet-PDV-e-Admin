import type { Table } from "@/types";

// Tables seed. Occupancy comes from checkId (see data/checks.ts — the ids
// must stay in sync with seedChecks).
const SEATS = [4, 4, 2, 6, 2, 4, 4, 6, 2, 4, 8, 4];

const CHECK_BY_TABLE: Record<number, string> = {
  2: "c-t2",
  3: "c-t3",
  4: "c-t4",
  6: "c-t6",
  7: "c-t7",
  8: "c-t8",
  10: "c-t10",
  11: "c-t11",
};

export function seedTables(): Table[] {
  return SEATS.map((seats, i) => {
    const num = i + 1;
    return {
      id: num,
      num,
      seats,
      checkId: CHECK_BY_TABLE[num] ?? null,
    };
  });
}
