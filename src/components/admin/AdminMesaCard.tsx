"use client";

import { StatusChip } from "@/components/ui/StatusChip";
import type { Table, Waiter } from "@/types";

interface AdminMesaCardProps {
  table: Table;
  waiters: Waiter[];
  onAssign: (waiterId: string) => void;
}

export function AdminMesaCard({ table, waiters, onAssign }: AdminMesaCardProps) {
  const occupied = table.status === "ocupada";

  return (
    <div
      className={`grid gap-3 rounded-[13px] border bg-white p-4 ${
        occupied ? "border-[#cfe1f5]" : "border-line"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[1.15rem] font-extrabold text-navy">Mesa {table.num}</div>
          <div className="mt-px text-[0.8rem] text-ink-muted">{table.seats} lugares</div>
        </div>
        <StatusChip kind={occupied ? "blue" : "green"}>
          {occupied ? "Ocupada" : "Livre"}
        </StatusChip>
      </div>

      <label className="grid gap-1.5">
        <span className="text-[0.72rem] font-bold uppercase tracking-[0.06em] text-ink-muted">
          Responsável
        </span>
        <select
          value={table.waiterId ?? ""}
          onChange={(e) => onAssign(e.target.value)}
          className="h-10 w-full rounded-[9px] border border-[#dbe2ea] bg-white px-2.5 text-[0.88rem] text-navy"
        >
          <option value="">— Livre —</option>
          {waiters.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
