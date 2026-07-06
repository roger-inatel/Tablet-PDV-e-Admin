import type { Comanda, ItemDraft } from "@/types";
import { PRODUTO_BY_ID } from "./produtos";

/** ISO timestamp n minutes before "now" (computed once at db init). */
export type MinutesAgo = (n: number) => string;

function draft(key: string, produtoId: string, qtd: number): ItemDraft {
  const p = PRODUTO_BY_ID[produtoId];
  return {
    key,
    produtoId,
    nome: p.name,
    precoUnit: p.price,
    estacao: p.estacao,
    qtd,
  };
}

// Demo-rich comanda seed. Versions > 1 make optimistic-concurrency demos
// realistic. Kept in sync with data/mesas.ts and data/pedidos.ts.
export function seedComandas(minutesAgo: MinutesAgo): Comanda[] {
  return [
    {
      // Mesa 2 — multi-pedido, both stations in flight.
      id: "c-m2",
      mesaId: 2,
      mesaNum: 2,
      garcomId: "carlos",
      status: "ABERTA",
      version: 4,
      itensDraft: [],
      pagamento: null,
      fiscal: null,
      abertaEm: minutesAgo(55),
      fechadaEm: null,
    },
    {
      // Mesa 3 — freshly dispatched pedido (KDS cozinha highlight).
      id: "c-m3",
      mesaId: 3,
      mesaNum: 3,
      garcomId: "marina",
      status: "ABERTA",
      version: 2,
      itensDraft: [],
      pagamento: null,
      fiscal: null,
      abertaEm: minutesAgo(12),
      fechadaEm: null,
    },
    {
      // Mesa 4 — drafts only (pre-send stage).
      id: "c-m4",
      mesaId: 4,
      mesaNum: 4,
      garcomId: "carlos",
      status: "ABERTA",
      version: 1,
      itensDraft: [draft("d-m4-1", "pr5", 1), draft("d-m4-2", "pr17", 1)],
      pagamento: null,
      fiscal: null,
      abertaEm: minutesAgo(6),
      fechadaEm: null,
    },
    {
      // Mesa 6 — one pedido spanning both stations, in preparation.
      id: "c-m6",
      mesaId: 6,
      mesaNum: 6,
      garcomId: "bruno",
      status: "ABERTA",
      version: 3,
      itensDraft: [],
      pagamento: null,
      fiscal: null,
      abertaEm: minutesAgo(34),
      fechadaEm: null,
    },
    {
      // Mesa 7 — bar pedido dispatched + a pending draft.
      id: "c-m7",
      mesaId: 7,
      mesaNum: 7,
      garcomId: "carlos",
      status: "ABERTA",
      version: 3,
      itensDraft: [draft("d-m7-1", "pr2", 1)],
      pagamento: null,
      fiscal: null,
      abertaEm: minutesAgo(25),
      fechadaEm: null,
    },
    {
      // Mesa 8 — closing started, awaiting payment.
      id: "c-m8",
      mesaId: 8,
      mesaNum: 8,
      garcomId: "marina",
      status: "EM_FECHAMENTO",
      version: 5,
      itensDraft: [],
      pagamento: null,
      fiscal: null,
      abertaEm: minutesAgo(78),
      fechadaEm: null,
    },
    {
      // Mesa 10 — bar queue.
      id: "c-m10",
      mesaId: 10,
      mesaNum: 10,
      garcomId: "julia",
      status: "ABERTA",
      version: 2,
      itensDraft: [],
      pagamento: null,
      fiscal: null,
      abertaEm: minutesAgo(18),
      fechadaEm: null,
    },
    {
      // Mesa 11 — paid, fiscal emission FAILED (retry demo on /admin/comandas).
      id: "c-m11",
      mesaId: 11,
      mesaNum: 11,
      garcomId: "carlos",
      status: "EM_FECHAMENTO",
      version: 6,
      itensDraft: [],
      pagamento: {
        id: "pg-m11",
        metodo: "cartao",
        valor: 230,
        criadoEm: minutesAgo(9),
      },
      fiscal: {
        status: "ERRO",
        tentativas: 1,
        erroMsg: "SEFAZ: timeout na emissão do documento",
      },
      abertaEm: minutesAgo(96),
      fechadaEm: null,
    },
    {
      // Historic closed comanda (mesa 5 earlier service) for /admin/comandas.
      id: "c-hist1",
      mesaId: 5,
      mesaNum: 5,
      garcomId: "marina",
      status: "FECHADA",
      version: 7,
      itensDraft: [],
      pagamento: {
        id: "pg-hist1",
        metodo: "pix",
        valor: 40,
        criadoEm: minutesAgo(64),
      },
      fiscal: {
        status: "EMITIDA",
        tentativas: 1,
        emitidaEm: minutesAgo(63),
        chave: "NFCe-3526-0707-0001-DEMO",
      },
      abertaEm: minutesAgo(110),
      fechadaEm: minutesAgo(63),
    },
  ];
}
