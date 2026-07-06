import type { ItemPedido, Pedido } from "@/types";
import type { PedidosRepo } from "../types";
import { InvalidTransitionError, NotFoundError } from "../errors";
import { assertTransicaoItem } from "@/lib/domain/maquinas";
import { pertenceAEstacao } from "@/lib/domain/pedido";
import { delay } from "@/lib/format";
import { criarEvento, getRealtimeClient, type EventoTipo } from "@/lib/realtime";
import { loadDb, saveDb, type DbV2 } from "./database";

function getPedido(db: DbV2, id: string): Pedido {
  const p = db.pedidos.find((x) => x.id === id);
  if (!p) throw new NotFoundError("Pedido", id);
  return p;
}

function persistPedido(db: DbV2, pedido: Pedido): void {
  saveDb({
    ...db,
    pedidos: db.pedidos.map((p) => (p.id === pedido.id ? pedido : p)),
  });
}

const EVENTO_POR_STATUS: Record<string, EventoTipo> = {
  RECEBIDO: "item.recebido",
  EM_PREPARO: "item.em_preparo",
  PRONTO: "item.pronto",
};

function timestampDe(status: ItemPedido["status"]): Partial<ItemPedido> {
  const agora = new Date().toISOString();
  switch (status) {
    case "RECEBIDO":
      return { recebidoEm: agora };
    case "EM_PREPARO":
      return { iniciadoEm: agora };
    case "PRONTO":
      return { prontoEm: agora };
    default:
      return {};
  }
}

export const pedidosRepo: PedidosRepo = {
  async list() {
    await delay();
    return loadDb().pedidos;
  },

  async listByEstacao(estacao) {
    await delay();
    return loadDb().pedidos.filter((p) => pertenceAEstacao(p, estacao));
  },

  async receber(pedidoId, estacao) {
    await delay();
    const db = loadDb();
    const pedido = getPedido(db, pedidoId);
    if (!pertenceAEstacao(pedido, estacao)) {
      throw new InvalidTransitionError("Pedido", "sem itens da estação", "receber");
    }
    const alvos = pedido.itens.filter(
      (it) => it.estacao === estacao && it.status === "ENVIADO",
    );
    // Idempotent bulk-ack: nothing pending -> no-op.
    if (alvos.length === 0) return pedido;

    const agora = new Date().toISOString();
    const atualizado: Pedido = {
      ...pedido,
      itens: pedido.itens.map((it) =>
        it.estacao === estacao && it.status === "ENVIADO"
          ? { ...it, status: "RECEBIDO", recebidoEm: agora }
          : it,
      ),
    };
    persistPedido(db, atualizado);
    const rt = getRealtimeClient();
    alvos.forEach((it) => {
      rt.publish(
        criarEvento("item.recebido", {
          pedido: atualizado,
          itemId: it.id,
          estacao,
        }),
      );
    });
    return atualizado;
  },

  async avancarItem(pedidoId, itemId, para) {
    await delay();
    const db = loadDb();
    const pedido = getPedido(db, pedidoId);
    const item = pedido.itens.find((it) => it.id === itemId);
    if (!item) throw new NotFoundError("ItemPedido", itemId);
    assertTransicaoItem(item.status, para);

    const atualizado: Pedido = {
      ...pedido,
      itens: pedido.itens.map((it) =>
        it.id === itemId ? { ...it, status: para, ...timestampDe(para) } : it,
      ),
    };
    persistPedido(db, atualizado);

    const tipo = EVENTO_POR_STATUS[para];
    if (tipo) {
      getRealtimeClient().publish(
        criarEvento(tipo as "item.recebido", {
          pedido: atualizado,
          itemId,
          estacao: item.estacao,
        }),
      );
    }
    return atualizado;
  },
};
