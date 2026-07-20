import type { Check, Order, RemovalRequest, Table, Waiter } from "@/types";
import { WAITERS } from "@/data/waiters";
import { seedTables } from "@/data/tables";

// Local operational store: ONE atomic localStorage blob, read-through on every
// repo operation so concurrent tabs always see the latest state. It holds only
// what the ERP has no home for (floor plan, checks, KDS orders, removals) —
// products come from the real database. There is NO demo data: the app starts
// with every table free and fills up from real usage.

export interface MockDb {
  tables: Table[];
  checks: Check[];
  orders: Order[];
  waiters: Waiter[];
  removals: RemovalRequest[];
}

// v4 drops the demo dataset — bumping the key makes existing browsers reseed
// instead of keeping the old fake checks/orders around.
const KEY = "mesaplus.db.v4";
const LEGACY_KEYS = [
  "mesaplus.tables.v1",
  "mesaplus.session.v1",
  "mesaplus.db.v2",
  "mesaplus.session.v2",
  "mesaplus.db.v3",
];

/** In-memory fallback for SSR / first paint (never persisted server-side). */
let memory: MockDb | null = null;

function buildSeed(): MockDb {
  return {
    tables: seedTables(),
    checks: [],
    orders: [],
    waiters: WAITERS.map((w) => ({ ...w })),
    removals: [],
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
    if (raw) {
      // Non-destructive: older blobs predate the `removals` slice — default it
      // so adding the feature never wipes the running demo state.
      const parsed = JSON.parse(raw) as Partial<MockDb>;
      return { ...(parsed as MockDb), removals: parsed.removals ?? [] };
    }
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
