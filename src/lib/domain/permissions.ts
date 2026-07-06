import type { Comanda, ItemPedido, Mesa, Sessao } from "@/types";

// Role-based permission predicates. The frontend uses these to gate UI and
// store actions; the future NestJS backend implements the SAME rules as
// guards (documented per endpoint in docs/CONTRACTS.md). Pure and
// unit-testable on purpose.

/** Garçons and gerentes can browse mesas; stations cannot. */
export function podeVerMesas(s: Sessao | null): boolean {
  return s !== null && s.papel !== "estacao";
}

/** Only a garçom can claim a free mesa (opening a comanda). */
export function podeAbrirComanda(s: Sessao | null, mesa: Mesa): boolean {
  return s?.papel === "garcom" && mesa.comandaId === null;
}

/** Is this session the waiter responsible for the comanda? */
export function ehResponsavel(s: Sessao | null, c: Comanda): boolean {
  return s?.papel === "garcom" && c.garcomId === s.garcomId;
}

/** Any garçom (read-only if not responsible) or gerente can view a comanda. */
export function podeVerComanda(s: Sessao | null): boolean {
  return s?.papel === "garcom" || s?.papel === "gerente";
}

/** Draft edits (add/inc/dec items): responsible waiter, comanda ABERTA. */
export function podeEditarDraft(s: Sessao | null, c: Comanda): boolean {
  return ehResponsavel(s, c) && c.status === "ABERTA";
}

/** Dispatch pending drafts as a pedido. */
export function podeEnviarPedido(s: Sessao | null, c: Comanda): boolean {
  return (
    ehResponsavel(s, c) && c.status === "ABERTA" && c.itensDraft.length > 0
  );
}

/** Start closing: responsible waiter OR gerente (caixa), no pending drafts. */
export function podeIniciarFechamento(s: Sessao | null, c: Comanda): boolean {
  const ator = ehResponsavel(s, c) || s?.papel === "gerente";
  return ator && c.status === "ABERTA" && c.itensDraft.length === 0;
}

export function podeRegistrarPagamento(s: Sessao | null, c: Comanda): boolean {
  const ator = ehResponsavel(s, c) || s?.papel === "gerente";
  return ator && c.status === "EM_FECHAMENTO" && c.pagamento === null;
}

export function podeCancelarFechamento(s: Sessao | null, c: Comanda): boolean {
  const ator = ehResponsavel(s, c) || s?.papel === "gerente";
  return ator && c.status === "EM_FECHAMENTO" && c.pagamento === null;
}

/** Fiscal retry is a manager/caixa operation. */
export function podeRetryFiscal(s: Sessao | null, c: Comanda): boolean {
  return s?.papel === "gerente" && c.fiscal?.status === "ERRO";
}

/** Reassigning the responsible waiter is a manager operation. */
export function podeTransferirComanda(s: Sessao | null): boolean {
  return s?.papel === "gerente";
}

/** KDS: a station may only advance items routed to itself. */
export function podeAvancarItem(s: Sessao | null, item: ItemPedido): boolean {
  return s?.papel === "estacao" && item.estacao === s.estacao;
}
