import type { ItemPedido, ItemPedidoStatus, Pedido } from "@/types";
import { PRODUTO_BY_ID } from "./produtos";
import type { MinutesAgo } from "./comandas";

interface ItemTimes {
  recebidoEm?: string;
  iniciadoEm?: string;
  prontoEm?: string;
}

function item(
  pedidoId: string,
  n: number,
  produtoId: string,
  qtd: number,
  status: ItemPedidoStatus,
  times: ItemTimes = {},
): ItemPedido {
  const p = PRODUTO_BY_ID[produtoId];
  return {
    id: `${pedidoId}-i${n}`,
    produtoId,
    nome: p.name,
    precoUnit: p.price,
    estacao: p.estacao,
    qtd,
    status,
    ...times,
  };
}

// Dispatched pedidos seed — in sync with data/comandas.ts scenarios.
export function seedPedidos(minutesAgo: MinutesAgo): Pedido[] {
  return [
    // Mesa 2 · Pedido #1 — mixed stations, mostly done.
    {
      id: "p-m2-1",
      comandaId: "c-m2",
      mesaId: 2,
      mesaNum: 2,
      garcomId: "carlos",
      seq: 1,
      criadoEm: minutesAgo(48),
      itens: [
        item("p-m2-1", 1, "pr0", 2, "PRONTO", {
          recebidoEm: minutesAgo(47),
          iniciadoEm: minutesAgo(44),
          prontoEm: minutesAgo(38),
        }),
        item("p-m2-1", 2, "pr6", 1, "EM_PREPARO", {
          recebidoEm: minutesAgo(47),
          iniciadoEm: minutesAgo(40),
        }),
        item("p-m2-1", 3, "pr16", 2, "PRONTO", {
          recebidoEm: minutesAgo(47),
          iniciadoEm: minutesAgo(46),
          prontoEm: minutesAgo(45),
        }),
      ],
    },
    // Mesa 2 · Pedido #2 — kitchen acknowledged.
    {
      id: "p-m2-2",
      comandaId: "c-m2",
      mesaId: 2,
      mesaNum: 2,
      garcomId: "carlos",
      seq: 2,
      criadoEm: minutesAgo(10),
      itens: [
        item("p-m2-2", 1, "pr8", 1, "RECEBIDO", {
          recebidoEm: minutesAgo(8),
        }),
      ],
    },
    // Mesa 3 · Pedido #1 — just dispatched (KDS cozinha "novo" highlight).
    {
      id: "p-m3-1",
      comandaId: "c-m3",
      mesaId: 3,
      mesaNum: 3,
      garcomId: "marina",
      seq: 1,
      criadoEm: minutesAgo(2),
      itens: [item("p-m3-1", 1, "pr4", 1, "ENVIADO")],
    },
    // Mesa 6 · Pedido #1 — both stations preparing.
    {
      id: "p-m6-1",
      comandaId: "c-m6",
      mesaId: 6,
      mesaNum: 6,
      garcomId: "bruno",
      seq: 1,
      criadoEm: minutesAgo(28),
      itens: [
        item("p-m6-1", 1, "pr7", 1, "EM_PREPARO", {
          recebidoEm: minutesAgo(27),
          iniciadoEm: minutesAgo(24),
        }),
        item("p-m6-1", 2, "pr12", 2, "EM_PREPARO", {
          recebidoEm: minutesAgo(27),
          iniciadoEm: minutesAgo(26),
        }),
      ],
    },
    // Mesa 7 · Pedido #1 — bar, still unseen by the KDS.
    {
      id: "p-m7-1",
      comandaId: "c-m7",
      mesaId: 7,
      mesaNum: 7,
      garcomId: "carlos",
      seq: 1,
      criadoEm: minutesAgo(4),
      itens: [item("p-m7-1", 1, "pr18", 2, "ENVIADO")],
    },
    // Mesa 8 · Pedido #1 — everything ready (closing in progress).
    {
      id: "p-m8-1",
      comandaId: "c-m8",
      mesaId: 8,
      mesaNum: 8,
      garcomId: "marina",
      seq: 1,
      criadoEm: minutesAgo(70),
      itens: [
        item("p-m8-1", 1, "pr3", 1, "PRONTO", {
          recebidoEm: minutesAgo(69),
          iniciadoEm: minutesAgo(66),
          prontoEm: minutesAgo(52),
        }),
        item("p-m8-1", 2, "pr19", 2, "PRONTO", {
          recebidoEm: minutesAgo(69),
          iniciadoEm: minutesAgo(68),
          prontoEm: minutesAgo(65),
        }),
      ],
    },
    // Mesa 10 · Pedido #1 — bar acknowledged.
    {
      id: "p-m10-1",
      comandaId: "c-m10",
      mesaId: 10,
      mesaNum: 10,
      garcomId: "julia",
      seq: 1,
      criadoEm: minutesAgo(15),
      itens: [
        item("p-m10-1", 1, "pr16", 2, "RECEBIDO", {
          recebidoEm: minutesAgo(13),
        }),
      ],
    },
    // Mesa 11 · Pedidos #1 e #2 — all ready; comanda stuck on fiscal ERRO.
    {
      id: "p-m11-1",
      comandaId: "c-m11",
      mesaId: 11,
      mesaNum: 11,
      garcomId: "carlos",
      seq: 1,
      criadoEm: minutesAgo(80),
      itens: [
        item("p-m11-1", 1, "pr6", 2, "PRONTO", {
          recebidoEm: minutesAgo(79),
          iniciadoEm: minutesAgo(74),
          prontoEm: minutesAgo(58),
        }),
        item("p-m11-1", 2, "pr13", 2, "PRONTO", {
          recebidoEm: minutesAgo(79),
          iniciadoEm: minutesAgo(78),
          prontoEm: minutesAgo(76),
        }),
      ],
    },
    {
      id: "p-m11-2",
      comandaId: "c-m11",
      mesaId: 11,
      mesaNum: 11,
      garcomId: "carlos",
      seq: 2,
      criadoEm: minutesAgo(40),
      itens: [
        item("p-m11-2", 1, "pr9", 2, "PRONTO", {
          recebidoEm: minutesAgo(39),
          iniciadoEm: minutesAgo(36),
          prontoEm: minutesAgo(30),
        }),
      ],
    },
    // Historic closed comanda (mesa 5).
    {
      id: "p-hist1-1",
      comandaId: "c-hist1",
      mesaId: 5,
      mesaNum: 5,
      garcomId: "marina",
      seq: 1,
      criadoEm: minutesAgo(100),
      itens: [
        item("p-hist1-1", 1, "pr10", 1, "PRONTO", {
          recebidoEm: minutesAgo(99),
          iniciadoEm: minutesAgo(95),
          prontoEm: minutesAgo(88),
        }),
        item("p-hist1-1", 2, "pr12", 1, "PRONTO", {
          recebidoEm: minutesAgo(99),
          iniciadoEm: minutesAgo(98),
          prontoEm: minutesAgo(96),
        }),
      ],
    },
  ];
}
