import type { Comanda, Pedido } from "@/types";
import type { ComandasRepo } from "../types";
import { InvalidTransitionError, NotFoundError } from "../errors";
import {
  assertPodeCancelarFechamento,
  assertPodeEditar,
  assertPodeIniciarFechamento,
  assertPodeRegistrarPagamento,
  assertPodeRetryFiscal,
  assertVersao,
} from "@/lib/domain/maquinas";
import {
  changeQtdDraft,
  draftsParaItens,
  mergeDraft,
  totalCobrado,
} from "@/lib/domain/pedido";
import { PRODUTO_BY_ID } from "@/data/produtos";
import { delay, uid } from "@/lib/format";
import { criarEvento, getRealtimeClient } from "@/lib/realtime";
import { loadDb, saveDb, type DbV2 } from "./database";
import { agendarEmissaoFiscal } from "./fiscalService";

// Mutation shape (mirrors the future server): load (read-through) -> pure
// domain transition (throws 409/422) -> persist -> publish realtime event.

function getComanda(db: DbV2, id: string): Comanda {
  const c = db.comandas.find((x) => x.id === id);
  if (!c) throw new NotFoundError("Comanda", id);
  return c;
}

function persistComanda(db: DbV2, comanda: Comanda, extra?: Partial<DbV2>): void {
  saveDb({
    ...db,
    ...extra,
    comandas: db.comandas.map((c) => (c.id === comanda.id ? comanda : c)),
  });
}

export const comandasRepo: ComandasRepo = {
  async list(filtro) {
    await delay();
    const all = loadDb().comandas;
    if (!filtro?.status?.length) return all;
    return all.filter((c) => filtro.status!.includes(c.status));
  },

  async get(id) {
    await delay();
    return loadDb().comandas.find((c) => c.id === id) ?? null;
  },

  async abrir(mesaId, garcomId) {
    await delay();
    const db = loadDb();
    const mesa = db.mesas.find((m) => m.id === mesaId);
    if (!mesa) throw new NotFoundError("Mesa", mesaId);
    if (mesa.comandaId !== null) {
      throw new InvalidTransitionError("Mesa", "ocupada", "abrir comanda");
    }
    const comanda: Comanda = {
      id: "c-" + uid(),
      mesaId: mesa.id,
      mesaNum: mesa.num,
      garcomId,
      status: "ABERTA",
      version: 1,
      itensDraft: [],
      pagamento: null,
      fiscal: null,
      abertaEm: new Date().toISOString(),
      fechadaEm: null,
    };
    const mesaOcupada = { ...mesa, comandaId: comanda.id };
    saveDb({
      ...db,
      comandas: [...db.comandas, comanda],
      mesas: db.mesas.map((m) => (m.id === mesaId ? mesaOcupada : m)),
    });
    getRealtimeClient().publish(
      criarEvento("comanda.aberta", { comanda, mesa: mesaOcupada }),
    );
    return comanda;
  },

  async addItemDraft(comandaId, produtoId) {
    await delay();
    const db = loadDb();
    const comanda = getComanda(db, comandaId);
    assertPodeEditar(comanda);
    const produto = PRODUTO_BY_ID[produtoId];
    if (!produto) throw new NotFoundError("Produto", produtoId);
    const atualizada: Comanda = {
      ...comanda,
      itensDraft: mergeDraft(comanda.itensDraft, produto),
      version: comanda.version + 1,
    };
    persistComanda(db, atualizada);
    getRealtimeClient().publish(
      criarEvento("comanda.atualizada", { comanda: atualizada }),
    );
    return atualizada;
  },

  async setQtdDraft(comandaId, key, delta) {
    await delay();
    const db = loadDb();
    const comanda = getComanda(db, comandaId);
    assertPodeEditar(comanda);
    const atualizada: Comanda = {
      ...comanda,
      itensDraft: changeQtdDraft(comanda.itensDraft, key, delta),
      version: comanda.version + 1,
    };
    persistComanda(db, atualizada);
    getRealtimeClient().publish(
      criarEvento("comanda.atualizada", { comanda: atualizada }),
    );
    return atualizada;
  },

  async enviarPedido(comandaId, expectedVersion) {
    await delay();
    const db = loadDb();
    const comanda = getComanda(db, comandaId);
    assertVersao(comanda, expectedVersion);
    assertPodeEditar(comanda);
    if (comanda.itensDraft.length === 0) {
      throw new InvalidTransitionError(
        "Comanda",
        "sem itens no rascunho",
        "enviar pedido",
      );
    }
    const seq =
      db.pedidos.filter((p) => p.comandaId === comandaId).length + 1;
    const pedido: Pedido = {
      id: "p-" + uid(),
      comandaId,
      mesaId: comanda.mesaId,
      mesaNum: comanda.mesaNum,
      garcomId: comanda.garcomId,
      seq,
      criadoEm: new Date().toISOString(),
      itens: draftsParaItens(comanda.itensDraft),
    };
    const atualizada: Comanda = {
      ...comanda,
      itensDraft: [],
      version: comanda.version + 1,
    };
    persistComanda(db, atualizada, { pedidos: [...db.pedidos, pedido] });
    getRealtimeClient().publish(
      criarEvento("pedido.enviado", { pedido, comanda: atualizada }),
    );
    return { comanda: atualizada, pedido };
  },

  async iniciarFechamento(comandaId, expectedVersion) {
    await delay();
    const db = loadDb();
    const comanda = getComanda(db, comandaId);
    assertVersao(comanda, expectedVersion);
    assertPodeIniciarFechamento(comanda);
    const atualizada: Comanda = {
      ...comanda,
      status: "EM_FECHAMENTO",
      version: comanda.version + 1,
    };
    persistComanda(db, atualizada);
    getRealtimeClient().publish(
      criarEvento("comanda.fechamento_iniciado", { comanda: atualizada }),
    );
    return atualizada;
  },

  async cancelarFechamento(comandaId) {
    await delay();
    const db = loadDb();
    const comanda = getComanda(db, comandaId);
    assertPodeCancelarFechamento(comanda);
    const atualizada: Comanda = {
      ...comanda,
      status: "ABERTA",
      version: comanda.version + 1,
    };
    persistComanda(db, atualizada);
    getRealtimeClient().publish(
      criarEvento("comanda.atualizada", { comanda: atualizada }),
    );
    return atualizada;
  },

  async registrarPagamento(comandaId, metodo, expectedVersion, opts) {
    await delay();
    const db = loadDb();
    const comanda = getComanda(db, comandaId);
    assertVersao(comanda, expectedVersion);
    assertPodeRegistrarPagamento(comanda);
    const valor = totalCobrado(
      db.pedidos.filter((p) => p.comandaId === comandaId),
    );
    const atualizada: Comanda = {
      ...comanda,
      pagamento: {
        id: "pg-" + uid(),
        metodo,
        valor,
        criadoEm: new Date().toISOString(),
      },
      fiscal: { status: "PROCESSANDO", tentativas: 1 },
      version: comanda.version + 1,
    };
    persistComanda(db, atualizada);
    getRealtimeClient().publish(
      criarEvento("pagamento.criado", {
        comanda: atualizada,
        pagamento: atualizada.pagamento!,
      }),
    );
    // Async fiscal emission — resolution arrives later as a realtime event.
    agendarEmissaoFiscal(comandaId, opts?.simularErroFiscal === true);
    return atualizada;
  },

  async retryFiscal(comandaId) {
    await delay();
    const db = loadDb();
    const comanda = getComanda(db, comandaId);
    assertPodeRetryFiscal(comanda);
    const atualizada: Comanda = {
      ...comanda,
      fiscal: {
        ...comanda.fiscal!,
        status: "PROCESSANDO",
        tentativas: comanda.fiscal!.tentativas + 1,
        erroMsg: undefined,
      },
      version: comanda.version + 1,
    };
    persistComanda(db, atualizada);
    getRealtimeClient().publish(
      criarEvento("comanda.atualizada", { comanda: atualizada }),
    );
    // Retries always succeed in the mock (deterministic demo).
    agendarEmissaoFiscal(comandaId, false);
    return atualizada;
  },

  async transferir(comandaId, garcomId) {
    await delay();
    const db = loadDb();
    const comanda = getComanda(db, comandaId);
    if (!db.garcons.some((g) => g.id === garcomId)) {
      throw new NotFoundError("Garcom", garcomId);
    }
    const atualizada: Comanda = {
      ...comanda,
      garcomId,
      version: comanda.version + 1,
    };
    persistComanda(db, atualizada);
    getRealtimeClient().publish(
      criarEvento("comanda.atualizada", { comanda: atualizada }),
    );
    return atualizada;
  },
};
