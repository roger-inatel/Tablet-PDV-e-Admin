import type { Table } from "@/types";
import { seedTables } from "@/data/tables";

// In-memory, mutable table state for the mock backend. It is the authoritative
// source of truth for comandas at runtime and persists itself to localStorage
// so a page refresh keeps the operational state. When wiring a real NestJS
// backend, this whole module is replaced by HTTP calls — nothing else changes.

const STORAGE_KEY = "mesaplus.tables.v1";

let tables: Table[] | null = null;

function persist(): void {
  if (typeof window === "undefined" || !tables) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tables));
  } catch {
    /* ignore quota/serialization errors in this demo */
  }
}

function load(): Table[] {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as Table[];
    } catch {
      /* fall through to seed */
    }
  }
  return seedTables();
}

export function getTables(): Table[] {
  if (tables === null) tables = load();
  return tables;
}

export function setTables(next: Table[]): void {
  tables = next;
  persist();
}

/** Reset to the original seed (useful for demos). */
export function resetTables(): Table[] {
  tables = seedTables();
  persist();
  return tables;
}
