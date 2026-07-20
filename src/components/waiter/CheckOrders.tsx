"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import { RemovalRequestModal } from "@/components/waiter/RemovalRequestModal";
import { orderItemStatusMeta } from "@/lib/domain/check";
import { canRequestRemoval } from "@/lib/domain/permissions";
import { fmt } from "@/lib/format";
import { useAppStore } from "@/store/useAppStore";
import type { Check, Order, OrderItem } from "@/types";

interface CheckOrdersProps {
  orders: Order[];
  check: Check;
}

function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Dispatched orders, grouped by batch. Item status is OWNED by the KDS — the
 * waiter only observes it here. The waiter may REQUEST removal of an item
 * (never removes it directly); a manager approves/rejects the request.
 */
export function CheckOrders({ orders, check }: CheckOrdersProps) {
  const session = useAppStore((s) => s.session);
  const removals = useAppStore((s) => s.removals);
  const requestRemoval = useAppStore((s) => s.requestRemoval);

  const [target, setTarget] = useState<{ orderId: string; item: OrderItem } | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  if (orders.length === 0) return null;

  const pendingItemIds = new Set(
    removals.filter((r) => r.status === "PENDING").map((r) => r.orderItemId),
  );

  const confirm = async (reason: string) => {
    if (!target) return;
    setSubmitting(true);
    const ok = await requestRemoval(target.orderId, target.item.id, reason);
    setSubmitting(false);
    if (ok) setTarget(null);
  };

  return (
    <div className="grid gap-4">
      {orders.map((o) => (
        <div key={o.id}>
          <div className="mb-2.5 flex items-center gap-2.5">
            <span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-status-blue-bg text-status-blue-fg">
              <Icon name="printer" size={15} />
            </span>
            <strong className="text-[0.95rem] text-navy">Pedido #{o.seq}</strong>
            <span className="text-[0.78rem] text-[#94a3b8]">
              enviado às {timeOf(o.createdAt)}
            </span>
          </div>
          <div className="grid gap-2">
            {o.items.map((it) => {
              const meta = orderItemStatusMeta(it.status);
              const pending = pendingItemIds.has(it.id);
              const canRemove =
                !it.voided && !pending && canRequestRemoval(session, check, it);
              return (
                <div
                  key={it.id}
                  className={`flex items-center gap-3 rounded-[11px] border px-[13px] py-[11px] ${
                    it.voided
                      ? "border-[#fecaca] bg-[#fef2f2]"
                      : "border-line bg-white"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div
                      className={`truncate text-[0.94rem] font-bold ${
                        it.voided ? "text-[#991b1b] line-through" : "text-navy"
                      }`}
                    >
                      {it.qty > 1 ? `${it.qty}× ${it.name}` : it.name}
                    </div>
                    <div className="mt-[3px] flex flex-wrap items-center gap-x-2 gap-y-1">
                      {it.voided ? (
                        <StatusChip kind="red">Removido</StatusChip>
                      ) : (
                        <StatusChip kind={meta.kind}>{meta.label}</StatusChip>
                      )}
                      {pending && !it.voided && (
                        <StatusChip kind="amber">Remoção solicitada</StatusChip>
                      )}
                      <span className="inline-flex items-center gap-1 text-[0.78rem] text-ink-muted">
                        <Icon
                          name={it.station === "kitchen" ? "flame" : "wine"}
                          size={12}
                        />
                        {it.station === "kitchen" ? "Cozinha" : "Bar"}
                      </span>
                      <span className="text-[0.8rem] text-ink-muted">
                        {fmt(it.unitPrice * it.qty)}
                      </span>
                    </div>
                  </div>
                  {canRemove ? (
                    <button
                      type="button"
                      onClick={() => setTarget({ orderId: o.id, item: it })}
                      title="Solicitar remoção"
                      className="inline-flex shrink-0 items-center gap-1 rounded-[9px] border border-[#fecaca] bg-white px-2.5 py-1.5 text-[0.78rem] font-bold text-[#dc2626]"
                    >
                      <Icon name="trash" size={13} strokeWidth={2.2} />
                      Remover
                    </button>
                  ) : (
                    <span className="shrink-0 text-[1rem] font-extrabold text-navy">
                      {it.qty}×
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {target && (
        <RemovalRequestModal
          itemName={target.item.name}
          qty={target.item.qty}
          amount={target.item.unitPrice * target.item.qty}
          submitting={submitting}
          onClose={() => setTarget(null)}
          onConfirm={confirm}
        />
      )}
    </div>
  );
}
