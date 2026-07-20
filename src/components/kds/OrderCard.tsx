"use client";

import { StatusChip } from "@/components/ui/StatusChip";
import { orderItemStatusMeta } from "@/lib/domain/check";
import { stationItems } from "@/lib/domain/order";
import type { Order, OrderItemStatus, OrderPriority, Station } from "@/types";

interface OrderCardProps {
  order: Order;
  station: Station;
  /** Card stage for this station (drives the highlight + bulk button). */
  stage: OrderItemStatus;
  waiterName: string;
  now: number;
  onReceive: () => void;
  onAdvance: (itemId: string, to: OrderItemStatus) => void;
}

function minutesSince(iso: string, now: number): number {
  return Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
}

const PRIORITY_META: Record<
  Exclude<OrderPriority, "normal">,
  { label: string; accent: string; kind: "red" | "amber" }
> = {
  urgente: { label: "Urgente", accent: "#dc2626", kind: "red" },
  alta: { label: "Alta", accent: "#d97706", kind: "amber" },
};

export function OrderCard({
  order,
  station,
  stage,
  waiterName,
  now,
  onReceive,
  onAdvance,
}: OrderCardProps) {
  const items = stationItems(order, station);
  const isNew = stage === "SENT";
  const minutes = minutesSince(order.createdAt, now);
  const priority = order.priority ?? "normal";
  const pmeta = priority !== "normal" ? PRIORITY_META[priority] : null;
  // Priority sets the left accent; a fresh dispatch still gets the amber ring.
  const accent = pmeta?.accent ?? (isNew ? "#f59e0b" : "#e5e9f0");

  return (
    <div
      className={`grid animate-[popin_.2s_ease] gap-2.5 rounded-[14px] border bg-white p-3.5 motion-reduce:animate-none ${
        isNew ? "border-[#f59e0b] shadow-[0_0_0_2px_rgba(245,158,11,.35)]" : "border-line"
      }`}
      style={{ borderLeft: `5px solid ${accent}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-[1.15rem] leading-none text-navy">
              Mesa {order.tableNum}
            </strong>
            {pmeta && <StatusChip kind={pmeta.kind}>{pmeta.label}</StatusChip>}
            {isNew && <StatusChip kind="amber">NOVO</StatusChip>}
          </div>
          <div className="mt-1 text-[0.76rem] text-ink-muted">
            Pedido #{order.seq} · {waiterName}
          </div>
        </div>
        <span
          className={`shrink-0 text-[0.82rem] font-bold ${
            minutes >= 15 ? "text-[#dc2626]" : "text-ink-muted"
          }`}
        >
          há {minutes} min
        </span>
      </div>

      <div className="grid gap-1.5">
        {items.map((it) => {
          const meta = orderItemStatusMeta(it.status);
          return (
            <div
              key={it.id}
              className="flex items-center gap-2.5 rounded-[10px] border border-[#eef1f6] bg-[#fbfcfe] px-2.5 py-2"
            >
              <span className="w-8 shrink-0 text-center text-[0.95rem] font-extrabold text-navy">
                {it.qty}×
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[0.9rem] font-semibold text-navy">
                  {it.name}
                </div>
                {it.notes && (
                  <div className="truncate text-[0.78rem] italic text-[#b45309]">
                    Obs.: {it.notes}
                  </div>
                )}
                <StatusChip kind={meta.kind}>{meta.label}</StatusChip>
              </div>
              {it.status === "RECEIVED" && (
                <button
                  type="button"
                  onClick={() => onAdvance(it.id, "PREPARING")}
                  className="shrink-0 rounded-[9px] bg-[#b45309] px-3 py-2 text-[0.8rem] font-bold text-white"
                >
                  Iniciar
                </button>
              )}
              {it.status === "PREPARING" && (
                <button
                  type="button"
                  onClick={() => onAdvance(it.id, "READY")}
                  className="shrink-0 rounded-[9px] bg-[#16a34a] px-3 py-2 text-[0.8rem] font-bold text-white"
                >
                  Pronto
                </button>
              )}
            </div>
          );
        })}
      </div>

      {isNew && (
        <button
          type="button"
          onClick={onReceive}
          className="rounded-[10px] bg-[#1f4e79] py-2.5 text-[0.9rem] font-extrabold text-white"
        >
          Receber pedido
        </button>
      )}
    </div>
  );
}
