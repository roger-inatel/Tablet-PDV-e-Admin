"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  Category,
  Comanda,
  ComandaVariant,
  Estacao,
  EstacaoConfig,
  Garcom,
  GarcomStatus,
  ItemPedidoStatus,
  Mesa,
  MesasVariant,
  MetodoPagamento,
  Pedido,
  Produto,
  Sessao,
} from "@/types";
import { repos, isConflictError } from "@/lib/api";
import type { EventoRealtime } from "@/lib/realtime";
import { uid } from "@/lib/format";

/** Payload for creating a new garcom from the admin drawer. */
export interface NewGarcomInput {
  name: string;
  login: string;
  status: GarcomStatus;
  phone?: string;
  note?: string;
}

const GARCOM_PALETTE = [
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
 * Version-guarded upsert: applies a comanda snapshot only when strictly newer.
 * This single rule makes event application idempotent and order-tolerant, and
 * silently drops the local echo of our own mutations (same version as the
 * repo response we already applied).
 */
function upsertComanda(list: Comanda[], c: Comanda): Comanda[] {
  const cur = list.find((x) => x.id === c.id);
  if (!cur) return [...list, c];
  if (c.version <= cur.version) return list;
  return list.map((x) => (x.id === c.id ? c : x));
}

function upsertPedido(list: Pedido[], p: Pedido): Pedido[] {
  return list.some((x) => x.id === p.id)
    ? list.map((x) => (x.id === p.id ? p : x))
    : [...list, p];
}

function upsertMesa(list: Mesa[], m: Mesa): Mesa[] {
  return list.map((x) => (x.id === m.id ? m : x));
}

interface AppState {
  // Reference data (loaded once from the repos)
  garcons: Garcom[];
  produtos: Produto[];
  categorias: Category[];
  estacoes: EstacaoConfig[];

  // Operational state (event-reconciled cache of the mock "server")
  mesas: Mesa[];
  comandas: Comanda[];
  pedidos: Pedido[];

  // Session (persisted per-tab in sessionStorage)
  sessao: Sessao | null;

  // UI prefs (persisted with the session)
  mesasVariant: MesasVariant;
  comandaVariant: ComandaVariant;

  // Transient
  toast: string | null;
  loaded: boolean;
  hydrated: boolean;

  // ---- lifecycle ----
  init: () => Promise<void>;
  refresh: () => Promise<void>;
  setHydrated: () => void;

  // ---- auth/session ----
  loginGarcom: (garcomId: string, pin: string) => Promise<Garcom["papel"] | null>;
  entrarEstacao: (estacao: Estacao) => void;
  logout: () => void;

  // ---- comanda (garcom/gerente) ----
  abrirComanda: (mesaId: number) => Promise<Comanda | null>;
  addItemDraft: (comandaId: string, produtoId: string) => Promise<void>;
  incDraft: (comandaId: string, key: string) => Promise<void>;
  decDraft: (comandaId: string, key: string) => Promise<void>;
  enviarPedido: (comandaId: string) => Promise<boolean>;
  iniciarFechamento: (comandaId: string) => Promise<boolean>;
  cancelarFechamento: (comandaId: string) => Promise<void>;
  registrarPagamento: (
    comandaId: string,
    metodo: MetodoPagamento,
    simularErroFiscal: boolean,
  ) => Promise<boolean>;
  retryFiscal: (comandaId: string) => Promise<void>;
  transferirComanda: (comandaId: string, garcomId: string) => Promise<void>;

  // ---- KDS (estacao) ----
  receberPedido: (pedidoId: string, estacao: Estacao) => Promise<void>;
  avancarItemPedido: (
    pedidoId: string,
    itemId: string,
    para: ItemPedidoStatus,
  ) => Promise<void>;

  // ---- garcons (admin) ----
  salvarGarcom: (id: string, patch: Partial<Garcom>) => Promise<void>;
  criarGarcom: (data: NewGarcomInput) => Promise<void>;

  // ---- realtime ----
  applyEvento: (evt: EventoRealtime) => void;

  // ---- ui ----
  setMesasVariant: (v: MesasVariant) => void;
  setComandaVariant: (v: ComandaVariant) => void;
  pushToast: (msg: string) => void;
  clearToast: () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      /** Shared 409 handling: refetch the comanda, surface a toast, no silent retry. */
      const handleMutationError = async (
        e: unknown,
        comandaId?: string,
      ): Promise<false> => {
        if (isConflictError(e) && comandaId) {
          const fresh = await repos.comandas.get(comandaId);
          if (fresh) {
            set((s) => ({ comandas: upsertComanda(s.comandas, fresh) }));
          }
          get().pushToast("Comanda atualizada por outro usuário");
        } else {
          get().pushToast(e instanceof Error ? e.message : "Erro inesperado");
        }
        return false;
      };

      return {
        garcons: [],
        produtos: [],
        categorias: [],
        estacoes: [],
        mesas: [],
        comandas: [],
        pedidos: [],
        sessao: null,
        mesasVariant: "detalhado",
        comandaVariant: "dividido",
        toast: null,
        loaded: false,
        hydrated: false,

        init: async () => {
          if (get().loaded) return;
          const [garcons, produtos, categorias, estacoes, mesas, comandas, pedidos] =
            await Promise.all([
              repos.garcons.list(),
              repos.produtos.list(),
              repos.produtos.categories(),
              repos.estacoes.list(),
              repos.mesas.list(),
              repos.comandas.list(),
              repos.pedidos.list(),
            ]);
          set({
            garcons,
            produtos,
            categorias,
            estacoes,
            mesas,
            comandas,
            pedidos,
            loaded: true,
          });
        },

        refresh: async () => {
          const [garcons, mesas, comandas, pedidos] = await Promise.all([
            repos.garcons.list(),
            repos.mesas.list(),
            repos.comandas.list(),
            repos.pedidos.list(),
          ]);
          set({ garcons, mesas, comandas, pedidos });
        },

        setHydrated: () => set({ hydrated: true }),

        loginGarcom: async (garcomId, pin) => {
          const g = await repos.garcons.authenticate(garcomId, pin);
          if (!g) {
            get().pushToast("PIN incorreto");
            return null;
          }
          set({ sessao: { papel: g.papel, garcomId: g.id } });
          get().pushToast(
            g.papel === "gerente" ? "Bem-vinda ao painel" : "Bem-vindo ao PDV",
          );
          return g.papel;
        },

        entrarEstacao: (estacao) => {
          set({ sessao: { papel: "estacao", estacao } });
        },

        logout: () => set({ sessao: null }),

        abrirComanda: async (mesaId) => {
          const { sessao } = get();
          if (sessao?.papel !== "garcom") return null;
          try {
            const comanda = await repos.comandas.abrir(mesaId, sessao.garcomId);
            set((s) => ({
              comandas: upsertComanda(s.comandas, comanda),
              mesas: s.mesas.map((m) =>
                m.id === mesaId ? { ...m, comandaId: comanda.id } : m,
              ),
            }));
            return comanda;
          } catch (e) {
            await handleMutationError(e);
            return null;
          }
        },

        addItemDraft: async (comandaId, produtoId) => {
          try {
            const comanda = await repos.comandas.addItemDraft(comandaId, produtoId);
            set((s) => ({ comandas: upsertComanda(s.comandas, comanda) }));
            const p = get().produtos.find((x) => x.id === produtoId);
            if (p) get().pushToast(`${p.name} adicionado`);
          } catch (e) {
            await handleMutationError(e, comandaId);
          }
        },

        incDraft: async (comandaId, key) => {
          try {
            const comanda = await repos.comandas.setQtdDraft(comandaId, key, 1);
            set((s) => ({ comandas: upsertComanda(s.comandas, comanda) }));
          } catch (e) {
            await handleMutationError(e, comandaId);
          }
        },

        decDraft: async (comandaId, key) => {
          try {
            const comanda = await repos.comandas.setQtdDraft(comandaId, key, -1);
            set((s) => ({ comandas: upsertComanda(s.comandas, comanda) }));
          } catch (e) {
            await handleMutationError(e, comandaId);
          }
        },

        enviarPedido: async (comandaId) => {
          const atual = get().comandas.find((c) => c.id === comandaId);
          if (!atual) return false;
          try {
            const { comanda, pedido } = await repos.comandas.enviarPedido(
              comandaId,
              atual.version,
            );
            set((s) => ({
              comandas: upsertComanda(s.comandas, comanda),
              pedidos: upsertPedido(s.pedidos, pedido),
            }));
            get().pushToast(`Pedido #${pedido.seq} enviado`);
            return true;
          } catch (e) {
            return handleMutationError(e, comandaId);
          }
        },

        iniciarFechamento: async (comandaId) => {
          const atual = get().comandas.find((c) => c.id === comandaId);
          if (!atual) return false;
          try {
            const comanda = await repos.comandas.iniciarFechamento(
              comandaId,
              atual.version,
            );
            set((s) => ({ comandas: upsertComanda(s.comandas, comanda) }));
            return true;
          } catch (e) {
            return handleMutationError(e, comandaId);
          }
        },

        cancelarFechamento: async (comandaId) => {
          try {
            const comanda = await repos.comandas.cancelarFechamento(comandaId);
            set((s) => ({ comandas: upsertComanda(s.comandas, comanda) }));
            get().pushToast("Fechamento cancelado");
          } catch (e) {
            await handleMutationError(e, comandaId);
          }
        },

        registrarPagamento: async (comandaId, metodo, simularErroFiscal) => {
          const atual = get().comandas.find((c) => c.id === comandaId);
          if (!atual) return false;
          try {
            const comanda = await repos.comandas.registrarPagamento(
              comandaId,
              metodo,
              atual.version,
              { simularErroFiscal },
            );
            set((s) => ({ comandas: upsertComanda(s.comandas, comanda) }));
            return true;
          } catch (e) {
            return handleMutationError(e, comandaId);
          }
        },

        retryFiscal: async (comandaId) => {
          try {
            const comanda = await repos.comandas.retryFiscal(comandaId);
            set((s) => ({ comandas: upsertComanda(s.comandas, comanda) }));
            get().pushToast("Reemitindo documento fiscal…");
          } catch (e) {
            await handleMutationError(e, comandaId);
          }
        },

        transferirComanda: async (comandaId, garcomId) => {
          try {
            const comanda = await repos.comandas.transferir(comandaId, garcomId);
            set((s) => ({ comandas: upsertComanda(s.comandas, comanda) }));
            get().pushToast("Responsável atualizado");
          } catch (e) {
            await handleMutationError(e, comandaId);
          }
        },

        receberPedido: async (pedidoId, estacao) => {
          try {
            const pedido = await repos.pedidos.receber(pedidoId, estacao);
            set((s) => ({ pedidos: upsertPedido(s.pedidos, pedido) }));
          } catch (e) {
            await handleMutationError(e);
          }
        },

        avancarItemPedido: async (pedidoId, itemId, para) => {
          try {
            const pedido = await repos.pedidos.avancarItem(pedidoId, itemId, para);
            set((s) => ({ pedidos: upsertPedido(s.pedidos, pedido) }));
          } catch (e) {
            await handleMutationError(e);
          }
        },

        salvarGarcom: async (id, patch) => {
          const atual = get().garcons.find((g) => g.id === id);
          if (!atual) return;
          const salvo = await repos.garcons.save({ ...atual, ...patch });
          set((s) => ({
            garcons: s.garcons.map((g) => (g.id === id ? salvo : g)),
          }));
          get().pushToast("Garçom atualizado");
        },

        criarGarcom: async (data) => {
          const id =
            "g" +
            (data.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || uid());
          const garcom: Garcom = {
            id,
            name: data.name.trim(),
            initials: initialsFrom(data.name),
            color: GARCOM_PALETTE[get().garcons.length % GARCOM_PALETTE.length],
            login: data.login.trim() || "@" + id,
            pin: "0000",
            papel: "garcom",
            cargo: "Garçom",
            status: data.status,
            phone: data.phone?.trim() || undefined,
            note: data.note?.trim() || undefined,
          };
          const salvo = await repos.garcons.save(garcom);
          set((s) => ({ garcons: [...s.garcons, salvo] }));
          get().pushToast("Garçom cadastrado");
        },

        applyEvento: (evt) => {
          switch (evt.tipo) {
            case "comanda.aberta":
            case "comanda.fechada":
              set((s) => ({
                comandas: upsertComanda(s.comandas, evt.payload.comanda),
                mesas: upsertMesa(s.mesas, evt.payload.mesa),
              }));
              break;
            case "comanda.atualizada":
            case "comanda.fechamento_iniciado":
            case "pagamento.criado":
            case "fiscal.erro":
              set((s) => ({
                comandas: upsertComanda(s.comandas, evt.payload.comanda),
              }));
              break;
            case "pedido.enviado":
              set((s) => ({
                pedidos: upsertPedido(s.pedidos, evt.payload.pedido),
                comandas: upsertComanda(s.comandas, evt.payload.comanda),
              }));
              break;
            case "item.recebido":
            case "item.em_preparo":
            case "item.pronto":
              set((s) => ({
                pedidos: upsertPedido(s.pedidos, evt.payload.pedido),
              }));
              break;
          }
        },

        setMesasVariant: (v) => set({ mesasVariant: v }),
        setComandaVariant: (v) => set({ comandaVariant: v }),

        pushToast: (msg) => {
          set({ toast: msg });
          if (toastTimer) clearTimeout(toastTimer);
          toastTimer = setTimeout(() => set({ toast: null }), 2200);
        },
        clearToast: () => set({ toast: null }),
      };
    },
    {
      name: "mesaplus.session.v2",
      // sessionStorage ON PURPOSE: each browser tab holds its own profile,
      // which is what makes the two-tab demo (garçom + KDS) possible and
      // mirrors per-device sessions in production.
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({
        sessao: s.sessao,
        mesasVariant: s.mesasVariant,
        comandaVariant: s.comandaVariant,
      }),
      skipHydration: true,
    },
  ),
);
