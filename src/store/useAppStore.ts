"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  Category,
  ComandaVariant,
  MesasVariant,
  Printer,
  Product,
  Sector,
  Table,
  Waiter,
  WaiterStatus,
} from "@/types";
import { repos } from "@/lib/api";
import { uid } from "@/lib/format";

/** Payload for creating a new waiter from the admin drawer. */
export interface NewWaiterInput {
  name: string;
  login: string;
  status: WaiterStatus;
  phone?: string;
  note?: string;
}

const WAITER_PALETTE = [
  "#2563eb",
  "#0d9488",
  "#b45309",
  "#7c3aed",
  "#be123c",
  "#0369a1",
];

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "G";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

interface OpenResult {
  ok: boolean;
  table?: Table;
  /** Name of the waiter holding the table, when blocked. */
  blockedBy?: string;
}

interface AppState {
  // Reference data (loaded once from the repos)
  waiters: Waiter[];
  products: Product[];
  categories: Category[];
  printers: Printer[];

  // Operational state — persisted by the repo layer, mirrored here for reactivity
  tables: Table[];

  // Session
  currentWaiterId: string | null;

  // UI preferences (persisted)
  mesasVariant: MesasVariant;
  comandaVariant: ComandaVariant;

  // Transient UI state
  toast: string | null;
  printModal: { tableId: number; sector: Sector } | null;

  // Lifecycle flags
  loaded: boolean; // reference + tables loaded from the repos
  hydrated: boolean; // persisted slice rehydrated on the client

  // ---- lifecycle ----
  init: () => Promise<void>;
  setHydrated: () => void;

  // ---- auth ----
  login: (waiterId: string, pin: string) => Promise<boolean>;
  logout: () => void;

  // ---- waiters (admin) ----
  updateWaiter: (id: string, patch: Partial<Waiter>) => Promise<void>;
  createWaiter: (data: NewWaiterInput) => Promise<void>;

  // ---- tables / comanda ----
  openTable: (id: number) => Promise<OpenResult>;
  addItem: (tableId: number, productId: string) => Promise<void>;
  incItem: (tableId: number, key: string) => Promise<void>;
  decItem: (tableId: number, key: string) => Promise<void>;
  advanceItem: (tableId: number, key: string) => Promise<void>;
  requestSend: (tableId: number, sector: Sector) => void;
  confirmSend: () => Promise<void>;
  closeModal: () => void;
  closeBill: (tableId: number) => Promise<void>;
  setResponsavel: (tableId: number, waiterId: string | null) => Promise<void>;

  // ---- ui ----
  setMesasVariant: (v: MesasVariant) => void;
  setComandaVariant: (v: ComandaVariant) => void;
  pushToast: (msg: string) => void;
  clearToast: () => void;
}

function replaceTable(tables: Table[], updated: Table): Table[] {
  return tables.map((t) => (t.id === updated.id ? updated : t));
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      waiters: [],
      products: [],
      categories: [],
      printers: [],
      tables: [],
      currentWaiterId: null,
      mesasVariant: "detalhado",
      comandaVariant: "dividido",
      toast: null,
      printModal: null,
      loaded: false,
      hydrated: false,

      init: async () => {
        if (get().loaded) return;
        const [waiters, products, categories, printers, tables] = await Promise.all([
          repos.waiters.list(),
          repos.products.list(),
          repos.products.categories(),
          repos.printers.list(),
          repos.tables.list(),
        ]);
        set({ waiters, products, categories, printers, tables, loaded: true });
      },

      setHydrated: () => set({ hydrated: true }),

      login: async (waiterId, pin) => {
        const w = await repos.waiters.authenticate(waiterId, pin);
        if (!w) {
          get().pushToast("PIN incorreto");
          return false;
        }
        set({ currentWaiterId: w.id });
        get().pushToast("Bem-vindo ao PDV");
        return true;
      },

      logout: () => set({ currentWaiterId: null }),

      updateWaiter: async (id, patch) => {
        const current = get().waiters.find((w) => w.id === id);
        if (!current) return;
        const updated = await repos.waiters.save({ ...current, ...patch });
        set((s) => ({
          waiters: s.waiters.map((w) => (w.id === id ? updated : w)),
        }));
        get().pushToast("Garçom atualizado");
      },

      createWaiter: async (data) => {
        const id =
          "g" +
          (data.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || uid());
        const waiter: Waiter = {
          id,
          name: data.name.trim(),
          initials: initialsFrom(data.name),
          color: WAITER_PALETTE[get().waiters.length % WAITER_PALETTE.length],
          login: data.login.trim() || "@" + id,
          pin: "0000",
          role: "Garçom",
          status: data.status,
          phone: data.phone?.trim() || undefined,
          note: data.note?.trim() || undefined,
        };
        const saved = await repos.waiters.save(waiter);
        set((s) => ({ waiters: [...s.waiters, saved] }));
        get().pushToast("Garçom cadastrado");
      },

      openTable: async (id) => {
        const { tables, currentWaiterId, waiters } = get();
        const t = tables.find((x) => x.id === id);
        if (!t || !currentWaiterId) return { ok: false };

        const mine = t.status === "ocupada" && t.waiterId === currentWaiterId;
        const locked = t.status === "ocupada" && t.waiterId !== currentWaiterId;

        if (locked) {
          const w = waiters.find((x) => x.id === t.waiterId);
          return { ok: false, blockedBy: w?.name };
        }
        if (t.status === "livre") {
          const updated = await repos.tables.open(id, currentWaiterId);
          set({ tables: replaceTable(tables, updated) });
          return { ok: true, table: updated };
        }
        // already mine
        void mine;
        return { ok: true, table: t };
      },

      addItem: async (tableId, productId) => {
        const updated = await repos.tables.addItem(tableId, productId);
        set((s) => ({ tables: replaceTable(s.tables, updated) }));
        const p = get().products.find((x) => x.id === productId);
        if (p) get().pushToast(`${p.name} adicionado`);
      },

      incItem: async (tableId, key) => {
        const updated = await repos.tables.setQty(tableId, key, 1);
        set((s) => ({ tables: replaceTable(s.tables, updated) }));
      },

      decItem: async (tableId, key) => {
        const updated = await repos.tables.setQty(tableId, key, -1);
        set((s) => ({ tables: replaceTable(s.tables, updated) }));
      },

      advanceItem: async (tableId, key) => {
        const updated = await repos.tables.advanceItem(tableId, key);
        set((s) => ({ tables: replaceTable(s.tables, updated) }));
      },

      requestSend: (tableId, sector) => {
        const t = get().tables.find((x) => x.id === tableId);
        if (!t) return;
        const hasPending = t.items.some(
          (it) => it.sector === sector && it.status === "PENDENTE",
        );
        if (!hasPending) {
          get().pushToast("Nenhum item pendente neste setor");
          return;
        }
        set({ printModal: { tableId, sector } });
      },

      confirmSend: async () => {
        const pm = get().printModal;
        if (!pm) return;
        const updated = await repos.tables.sendSector(pm.tableId, pm.sector);
        set((s) => ({ tables: replaceTable(s.tables, updated), printModal: null }));
        get().pushToast(
          pm.sector === "cozinha"
            ? "Pedido impresso na cozinha"
            : "Pedido impresso no bar",
        );
      },

      closeModal: () => set({ printModal: null }),

      closeBill: async (tableId) => {
        const updated = await repos.tables.closeBill(tableId);
        set((s) => ({ tables: replaceTable(s.tables, updated) }));
        get().pushToast("Conta fechada · mesa liberada");
      },

      setResponsavel: async (tableId, waiterId) => {
        const updated = await repos.tables.setResponsavel(tableId, waiterId);
        set((s) => ({ tables: replaceTable(s.tables, updated) }));
      },

      setMesasVariant: (v) => set({ mesasVariant: v }),
      setComandaVariant: (v) => set({ comandaVariant: v }),

      pushToast: (msg) => {
        set({ toast: msg });
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => set({ toast: null }), 2200);
      },
      clearToast: () => set({ toast: null }),
    }),
    {
      name: "mesaplus.session.v1",
      storage: createJSONStorage(() => localStorage),
      // Only the session + UI prefs are persisted here; table state is persisted
      // by the repo layer (see lib/api/mock/db.ts).
      partialize: (s) => ({
        currentWaiterId: s.currentWaiterId,
        mesasVariant: s.mesasVariant,
        comandaVariant: s.comandaVariant,
      }),
      skipHydration: true,
    },
  ),
);
