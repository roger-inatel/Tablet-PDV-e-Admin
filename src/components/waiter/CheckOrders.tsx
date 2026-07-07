"use client";

import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import { orderItemStatusMeta } from "@/lib/domain/check";
import { fmt } from "@/lib/format";
import type { Order } from "@/types";

interface CheckOrdersProps {
  orders: Order[];
}

function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Dispatched orders, grouped by batch. Item status is OWNED by the KDS —
 * the waiter only observes it here (chips update live via realtime events).
 */
export function CheckOrders({ orders }: CheckOrdersProps) {
  if (orders.length === 0) return null;

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
              return (
                <div
                  key={it.id}
                  className="flex items-center gap-3 rounded-[11px] border border-line bg-white px-[13px] py-[11px]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[0.94rem] font-bold text-navy">
                      {it.qty > 1 ? `${it.qty}× ${it.name}` : it.name}
                    </div>
                    <div className="mt-[3px] flex flex-wrap items-center gap-x-2 gap-y-1">
                      <StatusChip kind={meta.kind}>{meta.label}</StatusChip>
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
                  <span className="shrink-0 text-[1rem] font-extrabold text-navy">
                    {it.qty}×
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
