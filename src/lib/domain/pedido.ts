import type {
  Comanda,
  Estacao,
  ItemDraft,
  ItemPedido,
  ItemPedidoStatus,
  Pedido,
  Produto,
} from "@/types";
import { uid } from "@/lib/format";

// Pure v2 logic for drafts, pedidos and money. Shared by the mock repos and
// the UI selectors; the invariants here are part of the backend contract.

// ---- money -----------------------------------------------------------------

export function totalItens(
  itens: { precoUnit: number; qtd: number }[],
): number {
  return itens.reduce((sum, it) => sum + it.precoUnit * it.qtd, 0);
}

/** Charged amount at fechamento: dispatched items only (never drafts). */
export function totalCobrado(pedidos: Pedido[]): number {
  return pedidos.reduce((sum, p) => sum + totalItens(p.itens), 0);
}

/** Displayed running total: drafts + dispatched items. */
export function totalComanda(comanda: Comanda, pedidos: Pedido[]): number {
  return totalItens(comanda.itensDraft) + totalCobrado(pedidos);
}

// ---- drafts ----------------------------------------------------------------

/** Merge a product into the drafts (same product bumps qtd). */
export function mergeDraft(drafts: ItemDraft[], produto: Produto): ItemDraft[] {
  const idx = drafts.findIndex((d) => d.produtoId === produto.id);
  if (idx >= 0) {
    return drafts.map((d, i) => (i === idx ? { ...d, qtd: d.qtd + 1 } : d));
  }
  return [
    ...drafts,
    {
      key: uid(),
      produtoId: produto.id,
      nome: produto.name,
      precoUnit: produto.price,
      estacao: produto.estacao,
      qtd: 1,
    },
  ];
}

/** Change a draft's qtd by delta; removes the line at zero. */
export function changeQtdDraft(
  drafts: ItemDraft[],
  key: string,
  delta: 1 | -1,
): ItemDraft[] {
  return drafts.flatMap((d) => {
    if (d.key !== key) return [d];
    const qtd = d.qtd + delta;
    return qtd > 0 ? [{ ...d, qtd }] : [];
  });
}

/** Turn the current drafts into the itens of a new pedido (status ENVIADO). */
export function draftsParaItens(drafts: ItemDraft[]): ItemPedido[] {
  return drafts.map((d) => ({
    id: uid(),
    produtoId: d.produtoId,
    nome: d.nome,
    precoUnit: d.precoUnit,
    estacao: d.estacao,
    qtd: d.qtd,
    status: "ENVIADO" as ItemPedidoStatus,
  }));
}

// ---- station views ---------------------------------------------------------

export function itensDaEstacao(pedido: Pedido, estacao: Estacao): ItemPedido[] {
  return pedido.itens.filter((it) => it.estacao === estacao);
}

/** Does this pedido have anything for the station at all? */
export function pertenceAEstacao(pedido: Pedido, estacao: Estacao): boolean {
  return pedido.itens.some((it) => it.estacao === estacao);
}

/**
 * KDS card stage for a station = the least-advanced status among its items
 * (a card leaves "Recebido" only when every item has moved on).
 */
export function estagioDaEstacao(
  pedido: Pedido,
  estacao: Estacao,
): ItemPedidoStatus | null {
  const ordem: ItemPedidoStatus[] = [
    "ENVIADO",
    "RECEBIDO",
    "EM_PREPARO",
    "PRONTO",
  ];
  const itens = itensDaEstacao(pedido, estacao);
  if (itens.length === 0) return null;
  let min = ordem.length - 1;
  for (const it of itens) {
    min = Math.min(min, ordem.indexOf(it.status));
  }
  return ordem[min];
}
