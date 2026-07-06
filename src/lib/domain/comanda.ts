import type {
  ChipKind,
  Comanda,
  ComandaStatus,
  FiscalStatus,
  ItemPedidoStatus,
  MetodoPagamento,
  Pedido,
} from "@/types";

// v2 presentation-level domain helpers for comandas (chips, labels, counts).
// Money/draft/station logic lives in lib/domain/pedido.ts; state machines in
// lib/domain/maquinas.ts; role rules in lib/domain/permissions.ts.

export function comandaStatusMeta(status: ComandaStatus): {
  kind: ChipKind;
  label: string;
} {
  switch (status) {
    case "ABERTA":
      return { kind: "blue", label: "Aberta" };
    case "EM_FECHAMENTO":
      return { kind: "amber", label: "Em fechamento" };
    case "FECHADA":
      return { kind: "neutral", label: "Fechada" };
  }
}

export function itemPedidoStatusMeta(status: ItemPedidoStatus): {
  kind: ChipKind;
  label: string;
} {
  switch (status) {
    case "ENVIADO":
      return { kind: "blue", label: "Enviado" };
    case "RECEBIDO":
      return { kind: "neutral", label: "Recebido" };
    case "EM_PREPARO":
      return { kind: "amber", label: "Em preparo" };
    case "PRONTO":
      return { kind: "green", label: "Pronto" };
  }
}

export function fiscalStatusMeta(status: FiscalStatus): {
  kind: ChipKind;
  label: string;
} {
  switch (status) {
    case "PROCESSANDO":
      return { kind: "blue", label: "Emitindo NFC-e…" };
    case "EMITIDA":
      return { kind: "green", label: "NFC-e emitida" };
    case "ERRO":
      return { kind: "red", label: "Erro fiscal" };
  }
}

export const METODO_LABEL: Record<MetodoPagamento, string> = {
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  pix: "PIX",
};

/** Qty per item status across the comanda's pedidos (+ drafts as "a enviar"). */
export function contagensDaComanda(
  comanda: Comanda,
  pedidos: Pedido[],
): { aEnviar: number; porStatus: Record<ItemPedidoStatus, number> } {
  const porStatus: Record<ItemPedidoStatus, number> = {
    ENVIADO: 0,
    RECEBIDO: 0,
    EM_PREPARO: 0,
    PRONTO: 0,
  };
  for (const p of pedidos) {
    if (p.comandaId !== comanda.id) continue;
    for (const it of p.itens) porStatus[it.status] += it.qtd;
  }
  const aEnviar = comanda.itensDraft.reduce((s, d) => s + d.qtd, 0);
  return { aEnviar, porStatus };
}
