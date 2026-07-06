import type { Comanda, Mesa } from "@/types";
import { criarEvento, getRealtimeClient } from "@/lib/realtime";
import { loadDb, saveDb } from "./database";

// Async fiscal emission simulation (the ERP/SEFAZ integration). Mirrors the
// backend behavior: `registrarPagamento` answers immediately with fiscal
// PROCESSANDO and the outcome arrives LATER as a realtime event — either
// `comanda.fechada` (EMITIDA) or `fiscal.erro` (comanda stays EM_FECHAMENTO).

const FISCAL_DELAY_MS = 2500;
const ERRO_MSG = "SEFAZ: timeout na emissão do documento";

export function agendarEmissaoFiscal(
  comandaId: string,
  simularErro: boolean,
): void {
  setTimeout(() => processar(comandaId, simularErro), FISCAL_DELAY_MS);
}

function processar(comandaId: string, simularErro: boolean): void {
  const db = loadDb();
  const comanda = db.comandas.find((c) => c.id === comandaId);
  // The comanda may have changed while the "server" processed (e.g. another
  // actor). Only conclude an emission that is still pending.
  if (
    !comanda ||
    comanda.status !== "EM_FECHAMENTO" ||
    comanda.fiscal?.status !== "PROCESSANDO"
  ) {
    return;
  }

  const rt = getRealtimeClient();

  if (simularErro) {
    const atualizada: Comanda = {
      ...comanda,
      fiscal: { ...comanda.fiscal, status: "ERRO", erroMsg: ERRO_MSG },
      version: comanda.version + 1,
    };
    saveDb({
      ...db,
      comandas: db.comandas.map((c) => (c.id === comandaId ? atualizada : c)),
    });
    rt.publish(criarEvento("fiscal.erro", { comanda: atualizada, erro: ERRO_MSG }));
    return;
  }

  const emitidaEm = new Date().toISOString();
  const atualizada: Comanda = {
    ...comanda,
    status: "FECHADA",
    fechadaEm: emitidaEm,
    fiscal: {
      ...comanda.fiscal,
      status: "EMITIDA",
      emitidaEm,
      chave: `NFCe-${comanda.mesaNum.toString().padStart(2, "0")}-${Date.now().toString(36).toUpperCase()}`,
    },
    version: comanda.version + 1,
  };
  const mesaAtual = db.mesas.find((m) => m.id === comanda.mesaId);
  const mesaLivre: Mesa | undefined = mesaAtual
    ? { ...mesaAtual, comandaId: null }
    : undefined;

  saveDb({
    ...db,
    comandas: db.comandas.map((c) => (c.id === comandaId ? atualizada : c)),
    mesas: mesaLivre
      ? db.mesas.map((m) => (m.id === mesaLivre.id ? mesaLivre : m))
      : db.mesas,
  });
  if (mesaLivre) {
    rt.publish(
      criarEvento("comanda.fechada", { comanda: atualizada, mesa: mesaLivre }),
    );
  }
}
