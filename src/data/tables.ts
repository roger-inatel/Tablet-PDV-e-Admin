import type { Table } from "@/types";

// Tables seed — the floor plan only. Every table starts free; occupancy is
// derived from `checkId`, which is set when a waiter opens a check.
const SEATS = [4, 4, 2, 6, 2, 4, 4, 6, 2, 4, 8, 4];

export function seedTables(): Table[] {
  return SEATS.map((seats, i) => {
    const num = i + 1;
    return { id: num, num, seats, checkId: null };
  });
}
