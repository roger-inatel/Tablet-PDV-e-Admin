import type { Comanda, Garcom, Mesa, Pedido } from "@/types";
import { GARCONS } from "@/data/garcons";
import { seedMesas } from "@/data/mesas";
import { seedComandas } from "@/data/comandas";
import { seedPedidos } from "@/data/pedidos";

// v2 mock database: ONE atomic localStorage blob, read-through on every repo
// operation so concurrent tabs always see the latest state. Mutable entities
// only — produtos/estacoes are static reference data read from src/data.

export interface DbV2 {
  mesas: Mesa[];
  comandas: Comanda[];
  pedidos: Pedido[];
  garcons: Garcom[];
}

const KEY = "mesaplus.db.v2";
const LEGACY_KEYS = ["mesaplus.tables.v1", "mesaplus.session.v1"];

/** In-memory fallback for SSR / first paint (never persisted server-side). */
let memory: DbV2 | null = null;

function buildSeed(): DbV2 {
  // Timestamps are computed ONCE at db init (client-side, post-hydration) so
  // KDS elapsed-time displays stay meaningful, then persisted with the blob.
  const now = Date.now();
  const minutesAgo = (n: number) => new Date(now - n * 60_000).toISOString();
  return {
    mesas: seedMesas(),
    comandas: seedComandas(minutesAgo),
    pedidos: seedPedidos(minutesAgo),
    garcons: GARCONS.map((g) => ({ ...g })),
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
export function loadDb(): DbV2 {
  if (typeof window === "undefined") {
    if (memory === null) memory = buildSeed();
    return memory;
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DbV2;
  } catch {
    /* corrupted blob -> reseed */
  }
  const seeded = buildSeed();
  saveDb(seeded);
  cleanupLegacy();
  return seeded;
}

/** Atomic whole-blob write. */
export function saveDb(db: DbV2): void {
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
export function resetDb(): DbV2 {
  const seeded = buildSeed();
  saveDb(seeded);
  return seeded;
}
