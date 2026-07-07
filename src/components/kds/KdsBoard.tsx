"use client";

import { useEffect, useMemo, useState } from "react";
import { OrderCard } from "./OrderCard";
import { useAppStore } from "@/store/useAppStore";
import { kdsQueue, waitersById } from "@/store/selectors";
import { firstName } from "@/lib/format";
import type { OrderItemStatus, Station } from "@/types";

type Column = "RECEIVED" | "PREPARING" | "READY";

const COLUMNS: { id: Column; title: string; accent: string }[] = [
  { id: "RECEIVED", title: "Recebido", accent: "#f59e0b" },
  { id: "PREPARING", title: "Em preparo", accent: "#b45309" },
  { id: "READY", title: "Pronto", accent: "#16a34a" },
];

/** Which board column a card stage belongs to (SENT waits in "Recebido"). */
function columnOf(stage: OrderItemStatus): Column {
  if (stage === "SENT" || stage === "RECEIVED") return "RECEIVED";
  return stage;
}

/** Ticks every 30s so elapsed-time labels stay honest. */
function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function KdsBoard({ station }: { station: Station }) {
  const orders = useAppStore((s) => s.orders);
  const waiters = useAppStore((s) => s.waiters);
  const receiveOrder = useAppStore((s) => s.receiveOrder);
  const advanceOrderItem = useAppStore((s) => s.advanceOrderItem);

  const now = useNow();
  const [filter, setFilter] = useState<Column>("RECEIVED");

  const queue = useMemo(() => kdsQueue(orders, station), [orders, station]);
  const byId = useMemo(() => waitersById(waiters), [waiters]);

  const byColumn = useMemo(() => {
    const map: Record<Column, typeof queue> = {
      RECEIVED: [],
      PREPARING: [],
      READY: [],
    };
    for (const card of queue) map[columnOf(card.stage)].push(card);
    // Fresh dispatches first inside "Recebido".
    map.RECEIVED.sort((a, b) =>
      a.stage === b.stage ? 0 : a.stage === "SENT" ? -1 : 1,
    );
    return map;
  }, [queue]);

  const renderColumn = (col: (typeof COLUMNS)[number]) => (
    <div key={col.id} className="flex min-h-0 flex-col rounded-[14px] bg-white/[0.04]">
      <div className="flex items-center justify-between px-3.5 py-3">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: col.accent }}
          />
          <strong className="text-[0.9rem] text-slate-100">{col.title}</strong>
        </div>
        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[0.78rem] font-bold text-slate-200">
          {byColumn[col.id].length}
        </span>
      </div>
      <div className="grid min-h-0 flex-1 content-start gap-2.5 overflow-y-auto px-2.5 pb-3">
        {byColumn[col.id].map(({ order, stage }) => (
          <OrderCard
            key={order.id}
            order={order}
            station={station}
            stage={stage}
            waiterName={firstName(byId[order.waiterId]?.name ?? "—")}
            now={now}
            onReceive={() => receiveOrder(order.id, station)}
            onAdvance={(itemId, to) => advanceOrderItem(order.id, itemId, to)}
          />
        ))}
        {byColumn[col.id].length === 0 && (
          <div className="rounded-[10px] border border-dashed border-white/10 px-3 py-6 text-center text-[0.82rem] text-slate-500">
            Nada aqui
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Narrow screens: column filter chips */}
      <div className="flex gap-1.5 px-4 pb-1 pt-3 md:hidden">
        {COLUMNS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilter(c.id)}
            className={`flex-1 rounded-[10px] px-3 py-2 text-[0.82rem] font-bold ${
              filter === c.id ? "bg-white text-navy" : "bg-white/10 text-slate-300"
            }`}
          >
            {c.title} ({byColumn[c.id].length})
          </button>
        ))}
      </div>

      {/* Mobile: single filtered column */}
      <div className="flex min-h-0 flex-1 flex-col p-4 pt-2 md:hidden">
        {renderColumn(COLUMNS.find((c) => c.id === filter)!)}
      </div>

      {/* md+: 3 columns side by side */}
      <div className="hidden min-h-0 flex-1 grid-cols-3 gap-3.5 p-4 md:grid lg:px-6">
        {COLUMNS.map(renderColumn)}
      </div>
    </div>
  );
}
