import type { Check, Order, Table, Waiter } from "@/types";
import { WAITERS } from "@/data/waiters";
import { seedTables } from "@/data/tables";
import { seedChecks } from "@/data/checks";
import { seedOrders } from "@/data/orders";

// Mock database: ONE atomic localStorage blob, read-through on every repo
// operation so concurrent tabs always see the latest state. Mutable entities
// only — products/stations are static reference data read from src/data.

export interface MockDb {
  tables: Table[];
  checks: Check[];
  orders: Order[];
  waiters: Waiter[];
}

const KEY = "mesaplus.db.v3";
const LEGACY_KEYS = [
  "mesaplus.tables.v1",
  "mesaplus.session.v1",
  "mesaplus.db.v2",
  "mesaplus.session.v2",
];

/** In-memory fallback for SSR / first paint (never persisted server-side). */
let memory: MockDb | null = null;

function buildSeed(): MockDb {
  // Timestamps are computed ONCE at db init (client-side, post-hydration) so
  // KDS elapsed-time displays stay meaningful, then persisted with the blob.
  const now = Date.now();
  const minutesAgo = (n: number) => new Date(now - n * 60_000).toISOString();
  return {
    tables: seedTables(),
    checks: seedChecks(minutesAgo),
    orders: seedOrders(minutesAgo),
    waiters: WAITERS.map((w) => ({ ...w })),
  };
}

function cleanupLegacy(): void {
  try {
    LEGACY_KEYS.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

/** Read-through load. Seeds (and persists) on first access. */
export function loadDb(): MockDb {
  if (typeof window === "undefined") {
    if (memory === null) memory = buildSeed();
    return memory;
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as MockDb;
  } catch {
    /* corrupted blob -> reseed */
  }
  const seeded = buildSeed();
  saveDb(seeded);
  cleanupLegacy();
  return seeded;
}

/** Atomic whole-blob write. */
export function saveDb(db: MockDb): void {
  if (typeof window === "undefined") {
    memory = db;
    return;
  }
  try {
    window.localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* quota errors are non-fatal in the demo */
  }
}

/** Reset to a fresh seed (demo helper). */
export function resetDb(): MockDb {
  const seeded = buildSeed();
  saveDb(seeded);
  return seeded;
}
