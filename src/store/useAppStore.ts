"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  Category,
  Check,
  CheckVariant,
  Order,
  OrderItemStatus,
  PaymentMethod,
  Product,
  Session,
  Station,
  StationConfig,
  Table,
  TablesVariant,
  Waiter,
  WaiterStatus,
} from "@/types";
import { repos, isConflictError } from "@/lib/api";
import type { RealtimeEvent } from "@/lib/realtime";
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

// ---- reconciliation helpers -------------------------------------------------

/**
 * Version-guarded upsert: applies a check snapshot only when strictly newer.
 * This single rule makes event application idempotent and order-tolerant, and
 * silently drops the local echo of our own mutations (same version as the
 * repo response we already applied).
 */
function upsertCheck(list: Check[], c: Check): Check[] {
  const cur = list.find((x) => x.id === c.id);
  if (!cur) return [...list, c];
  if (c.version <= cur.version) return list;
  return list.map((x) => (x.id === c.id ? c : x));
}

function upsertOrder(list: Order[], o: Order): Order[] {
  return list.some((x) => x.id === o.id)
    ? list.map((x) => (x.id === o.id ? o : x))
    : [...list, o];
}

function upsertTable(list: Table[], t: Table): Table[] {
  return list.map((x) => (x.id === t.id ? t : x));
}

interface AppState {
  // Reference data (loaded once from the repos)
  waiters: Waiter[];
  products: Product[];
  categories: Category[];
  stations: StationConfig[];

  // Operational state (event-reconciled cache of the mock "server")
  tables: Table[];
  checks: Check[];
  orders: Order[];

  // Session (persisted per-tab in sessionStorage)
  session: Session | null;

  // UI prefs (persisted with the session)
  tablesVariant: TablesVariant;
  checkVariant: CheckVariant;

  // Transient
  toast: string | null;
  loaded: boolean;
  hydrated: boolean;

  // ---- lifecycle ----
  init: () => Promise<void>;
  refresh: () => Promise<void>;
  setHydrated: () => void;

  // ---- auth/session ----
  loginWaiter: (waiterId: string, pin: string) => Promise<Waiter["role"] | null>;
  enterStation: (station: Station) => void;
  logout: () => void;

  // ---- check (waiter/manager) ----
  openCheck: (tableId: number) => Promise<Check | null>;
  addDraftItem: (checkId: string, productId: string) => Promise<void>;
  incDraftItem: (checkId: string, key: string) => Promise<void>;
  decDraftItem: (checkId: string, key: string) => Promise<void>;
  sendOrder: (checkId: string) => Promise<boolean>;
  startCheckout: (checkId: string) => Promise<boolean>;
  cancelCheckout: (checkId: string) => Promise<void>;
  registerPayment: (
    checkId: string,
    method: PaymentMethod,
    simulateFiscalError: boolean,
  ) => Promise<boolean>;
  retryFiscal: (checkId: string) => Promise<void>;
  transferCheck: (checkId: string, waiterId: string) => Promise<void>;

  // ---- KDS (station) ----
  receiveOrder: (orderId: string, station: Station) => Promise<void>;
  advanceOrderItem: (
    orderId: string,
    itemId: string,
    to: OrderItemStatus,
  ) => Promise<void>;

  // ---- waiters (admin) ----
  saveWaiter: (id: string, patch: Partial<Waiter>) => Promise<void>;
  createWaiter: (data: NewWaiterInput) => Promise<void>;

  // ---- realtime ----
  applyEvent: (event: RealtimeEvent) => void;

  // ---- ui ----
  setTablesVariant: (v: TablesVariant) => void;
  setCheckVariant: (v: CheckVariant) => void;
  pushToast: (msg: string) => void;
  clearToast: () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      /** Shared 409 handling: refetch the check, surface a toast, no silent retry. */
      const handleMutationError = async (
        e: unknown,
        checkId?: string,
      ): Promise<false> => {
        if (isConflictError(e) && checkId) {
          const fresh = await repos.checks.get(checkId);
          if (fresh) {
            set((s) => ({ checks: upsertCheck(s.checks, fresh) }));
          }
          get().pushToast("Comanda atualizada por outro usuário");
        } else {
          get().pushToast(e instanceof Error ? e.message : "Erro inesperado");
        }
        return false;
      };

      return {
        waiters: [],
        products: [],
        categories: [],
        stations: [],
        tables: [],
        checks: [],
        orders: [],
        session: null,
        tablesVariant: "detailed",
        checkVariant: "split",
        toast: null,
        loaded: false,
        hydrated: false,

        init: async () => {
          if (get().loaded) return;
          const [waiters, products, categories, stations, tables, checks, orders] =
            await Promise.all([
              repos.waiters.list(),
              repos.products.list(),
              repos.products.categories(),
              repos.stations.list(),
              repos.tables.list(),
              repos.checks.list(),
              repos.orders.list(),
            ]);
          set({
            waiters,
            products,
            categories,
            stations,
            tables,
            checks,
            orders,
            loaded: true,
          });
        },

        refresh: async () => {
          const [waiters, tables, checks, orders] = await Promise.all([
            repos.waiters.list(),
            repos.tables.list(),
            repos.checks.list(),
            repos.orders.list(),
          ]);
          set({ waiters, tables, checks, orders });
        },

        setHydrated: () => set({ hydrated: true }),

        loginWaiter: async (waiterId, pin) => {
          const w = await repos.waiters.authenticate(waiterId, pin);
          if (!w) {
            get().pushToast("PIN incorreto");
            return null;
          }
          set({ session: { role: w.role, waiterId: w.id } });
          get().pushToast(
            w.role === "manager" ? "Bem-vinda ao painel" : "Bem-vindo ao PDV",
          );
          return w.role;
        },

        enterStation: (station) => {
          set({ session: { role: "station", station } });
        },

        logout: () => set({ session: null }),

        openCheck: async (tableId) => {
          const { session } = get();
          if (session?.role !== "waiter") return null;
          try {
            const check = await repos.checks.open(tableId, session.waiterId);
            set((s) => ({
              checks: upsertCheck(s.checks, check),
              tables: s.tables.map((t) =>
                t.id === tableId ? { ...t, checkId: check.id } : t,
              ),
            }));
            return check;
          } catch (e) {
            await handleMutationError(e);
            return null;
          }
        },

        addDraftItem: async (checkId, productId) => {
          try {
            const check = await repos.checks.addDraftItem(checkId, productId);
            set((s) => ({ checks: upsertCheck(s.checks, check) }));
            const p = get().products.find((x) => x.id === productId);
            if (p) get().pushToast(`${p.name} adicionado`);
          } catch (e) {
            await handleMutationError(e, checkId);
          }
        },

        incDraftItem: async (checkId, key) => {
          try {
            const check = await repos.checks.setDraftQty(checkId, key, 1);
            set((s) => ({ checks: upsertCheck(s.checks, check) }));
          } catch (e) {
            await handleMutationError(e, checkId);
          }
        },

        decDraftItem: async (checkId, key) => {
          try {
            const check = await repos.checks.setDraftQty(checkId, key, -1);
            set((s) => ({ checks: upsertCheck(s.checks, check) }));
          } catch (e) {
            await handleMutationError(e, checkId);
          }
        },

        sendOrder: async (checkId) => {
          const current = get().checks.find((c) => c.id === checkId);
          if (!current) return false;
          try {
            const { check, order } = await repos.checks.sendOrder(
              checkId,
              current.version,
            );
            set((s) => ({
              checks: upsertCheck(s.checks, check),
              orders: upsertOrder(s.orders, order),
            }));
            get().pushToast(`Pedido #${order.seq} enviado`);
            return true;
          } catch (e) {
            return handleMutationError(e, checkId);
          }
        },

        startCheckout: async (checkId) => {
          const current = get().checks.find((c) => c.id === checkId);
          if (!current) return false;
          try {
            const check = await repos.checks.startCheckout(
              checkId,
              current.version,
            );
            set((s) => ({ checks: upsertCheck(s.checks, check) }));
            return true;
          } catch (e) {
            return handleMutationError(e, checkId);
          }
        },

        cancelCheckout: async (checkId) => {
          try {
            const check = await repos.checks.cancelCheckout(checkId);
            set((s) => ({ checks: upsertCheck(s.checks, check) }));
            get().pushToast("Fechamento cancelado");
          } catch (e) {
            await handleMutationError(e, checkId);
          }
        },

        registerPayment: async (checkId, method, simulateFiscalError) => {
          const current = get().checks.find((c) => c.id === checkId);
          if (!current) return false;
          try {
            const check = await repos.checks.registerPayment(
              checkId,
              method,
              current.version,
              { simulateFiscalError },
            );
            set((s) => ({ checks: upsertCheck(s.checks, check) }));
            return true;
          } catch (e) {
            return handleMutationError(e, checkId);
          }
        },

        retryFiscal: async (checkId) => {
          try {
            const check = await repos.checks.retryFiscal(checkId);
            set((s) => ({ checks: upsertCheck(s.checks, check) }));
            get().pushToast("Reemitindo documento fiscal…");
          } catch (e) {
            await handleMutationError(e, checkId);
          }
        },

        transferCheck: async (checkId, waiterId) => {
          try {
            const check = await repos.checks.transfer(checkId, waiterId);
            set((s) => ({ checks: upsertCheck(s.checks, check) }));
            get().pushToast("Responsável atualizado");
          } catch (e) {
            await handleMutationError(e, checkId);
          }
        },

        receiveOrder: async (orderId, station) => {
          try {
            const order = await repos.orders.receive(orderId, station);
            set((s) => ({ orders: upsertOrder(s.orders, order) }));
          } catch (e) {
            await handleMutationError(e);
          }
        },

        advanceOrderItem: async (orderId, itemId, to) => {
          try {
            const order = await repos.orders.advanceItem(orderId, itemId, to);
            set((s) => ({ orders: upsertOrder(s.orders, order) }));
          } catch (e) {
            await handleMutationError(e);
          }
        },

        saveWaiter: async (id, patch) => {
          const current = get().waiters.find((w) => w.id === id);
          if (!current) return;
          const saved = await repos.waiters.save({ ...current, ...patch });
          set((s) => ({
            waiters: s.waiters.map((w) => (w.id === id ? saved : w)),
          }));
          get().pushToast("Garçom atualizado");
        },

        createWaiter: async (data) => {
          const id =
            "w" +
            (data.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || uid());
          const waiter: Waiter = {
            id,
            name: data.name.trim(),
            initials: initialsFrom(data.name),
            color: WAITER_PALETTE[get().waiters.length % WAITER_PALETTE.length],
            login: data.login.trim() || "@" + id,
            pin: "0000",
            role: "waiter",
            roleLabel: "Garçom",
            status: data.status,
            phone: data.phone?.trim() || undefined,
            note: data.note?.trim() || undefined,
          };
          const saved = await repos.waiters.save(waiter);
          set((s) => ({ waiters: [...s.waiters, saved] }));
          get().pushToast("Garçom cadastrado");
        },

        applyEvent: (event) => {
          switch (event.type) {
            case "check.opened":
            case "check.closed":
              set((s) => ({
                checks: upsertCheck(s.checks, event.payload.check),
                tables: upsertTable(s.tables, event.payload.table),
              }));
              break;
            case "check.updated":
            case "check.checkout_started":
            case "payment.created":
            case "fiscal.error":
              set((s) => ({
                checks: upsertCheck(s.checks, event.payload.check),
              }));
              break;
            case "order.sent":
              set((s) => ({
                orders: upsertOrder(s.orders, event.payload.order),
                checks: upsertCheck(s.checks, event.payload.check),
              }));
              break;
            case "order_item.received":
            case "order_item.preparing":
            case "order_item.ready":
              set((s) => ({
                orders: upsertOrder(s.orders, event.payload.order),
              }));
              break;
          }
        },

        setTablesVariant: (v) => set({ tablesVariant: v }),
        setCheckVariant: (v) => set({ checkVariant: v }),

        pushToast: (msg) => {
          set({ toast: msg });
          if (toastTimer) clearTimeout(toastTimer);
          toastTimer = setTimeout(() => set({ toast: null }), 2200);
        },
        clearToast: () => set({ toast: null }),
      };
    },
    {
      name: "mesaplus.session.v3",
      // sessionStorage ON PURPOSE: each browser tab holds its own profile,
      // which is what makes the two-tab demo (waiter + KDS) possible and
      // mirrors per-device sessions in production.
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({
        session: s.session,
        tablesVariant: s.tablesVariant,
        checkVariant: s.checkVariant,
      }),
      skipHydration: true,
    },
  ),
);
