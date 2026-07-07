import type {
  Check,
  CheckStatus,
  ChipKind,
  FiscalStatus,
  Order,
  OrderItemStatus,
  PaymentMethod,
} from "@/types";

// Presentation-level domain helpers for checks (chips, labels, counts).
// Labels are pt-BR on purpose — they are user-facing copy.
// Money/draft/station logic lives in lib/domain/order.ts; state machines in
// lib/domain/stateMachines.ts; role rules in lib/domain/permissions.ts.

export function checkStatusMeta(status: CheckStatus): {
  kind: ChipKind;
  label: string;
} {
  switch (status) {
    case "OPEN":
      return { kind: "blue", label: "Aberta" };
    case "IN_CHECKOUT":
      return { kind: "amber", label: "Em fechamento" };
    case "CLOSED":
      return { kind: "neutral", label: "Fechada" };
  }
}

export function orderItemStatusMeta(status: OrderItemStatus): {
  kind: ChipKind;
  label: string;
} {
  switch (status) {
    case "SENT":
      return { kind: "blue", label: "Enviado" };
    case "RECEIVED":
      return { kind: "neutral", label: "Recebido" };
    case "PREPARING":
      return { kind: "amber", label: "Em preparo" };
    case "READY":
      return { kind: "green", label: "Pronto" };
  }
}

export function fiscalStatusMeta(status: FiscalStatus): {
  kind: ChipKind;
  label: string;
} {
  switch (status) {
    case "PROCESSING":
      return { kind: "blue", label: "Emitindo NFC-e…" };
    case "ISSUED":
      return { kind: "green", label: "NFC-e emitida" };
    case "ERROR":
      return { kind: "red", label: "Erro fiscal" };
  }
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Dinheiro",
  card: "Cartão",
  pix: "PIX",
};

/** Qty per item status across the check's orders (+ drafts as "to send"). */
export function checkItemCounts(
  check: Check,
  orders: Order[],
): { toSend: number; byStatus: Record<OrderItemStatus, number> } {
  const byStatus: Record<OrderItemStatus, number> = {
    SENT: 0,
    RECEIVED: 0,
    PREPARING: 0,
    READY: 0,
  };
  for (const o of orders) {
    if (o.checkId !== check.id) continue;
    for (const it of o.items) byStatus[it.status] += it.qty;
  }
  const toSend = check.draftItems.reduce((s, d) => s + d.qty, 0);
  return { toSend, byStatus };
}
