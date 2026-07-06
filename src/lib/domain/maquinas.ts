import type { Comanda, ComandaStatus, ItemPedidoStatus } from "@/types";
import { ConflictError, InvalidTransitionError } from "@/lib/api/errors";

// State machines of the v2 domain. Enforced by the mock repos and exported to
// docs/CONTRACTS.md — the NestJS backend must implement these exact tables.

/** Comanda lifecycle. EM_FECHAMENTO -> ABERTA only via cancelarFechamento
 *  (and only while pagamento === null — enforced at the repo/domain call). */
export const COMANDA_TRANSICOES: Record<ComandaStatus, ComandaStatus[]> = {
  ABERTA: ["EM_FECHAMENTO"],
  EM_FECHAMENTO: ["ABERTA", "FECHADA"],
  FECHADA: [],
};

/** Strictly linear item flow, advanced only by the item's station KDS. */
export const ITEM_PEDIDO_FLUXO: ItemPedidoStatus[] = [
  "ENVIADO",
  "RECEBIDO",
  "EM_PREPARO",
  "PRONTO",
];

export function proximoStatusItem(
  atual: ItemPedidoStatus,
): ItemPedidoStatus | null {
  const i = ITEM_PEDIDO_FLUXO.indexOf(atual);
  return ITEM_PEDIDO_FLUXO[i + 1] ?? null;
}

export function assertTransicaoComanda(
  de: ComandaStatus,
  para: ComandaStatus,
): void {
  if (!COMANDA_TRANSICOES[de].includes(para)) {
    throw new InvalidTransitionError("Comanda", de, para);
  }
}

export function assertTransicaoItem(
  de: ItemPedidoStatus,
  para: ItemPedidoStatus,
): void {
  if (proximoStatusItem(de) !== para) {
    throw new InvalidTransitionError("ItemPedido", de, para);
  }
}

/** Optimistic-concurrency check for sensitive comanda mutations. */
export function assertVersao(comanda: Comanda, expectedVersion: number): void {
  if (comanda.version !== expectedVersion) {
    throw new ConflictError(
      `Comanda ${comanda.id}`,
      expectedVersion,
      comanda.version,
    );
  }
}

/** Guards beyond pure status transitions (documented in CONTRACTS.md). */
export function assertPodeEditar(comanda: Comanda): void {
  if (comanda.status !== "ABERTA") {
    throw new InvalidTransitionError("Comanda", comanda.status, "edição de itens");
  }
}

export function assertPodeIniciarFechamento(comanda: Comanda): void {
  assertTransicaoComanda(comanda.status, "EM_FECHAMENTO");
  if (comanda.itensDraft.length > 0) {
    throw new InvalidTransitionError(
      "Comanda",
      "com itens não enviados",
      "EM_FECHAMENTO",
    );
  }
}

export function assertPodeCancelarFechamento(comanda: Comanda): void {
  assertTransicaoComanda(comanda.status, "ABERTA");
  if (comanda.pagamento !== null) {
    throw new InvalidTransitionError(
      "Comanda",
      "EM_FECHAMENTO com pagamento",
      "ABERTA",
    );
  }
}

export function assertPodeRegistrarPagamento(comanda: Comanda): void {
  if (comanda.status !== "EM_FECHAMENTO" || comanda.pagamento !== null) {
    throw new InvalidTransitionError(
      "Comanda",
      comanda.status,
      "registrar pagamento",
    );
  }
}

export function assertPodeRetryFiscal(comanda: Comanda): void {
  if (comanda.fiscal?.status !== "ERRO") {
    throw new InvalidTransitionError(
      "Fiscal",
      comanda.fiscal?.status ?? "inexistente",
      "retry",
    );
  }
}
