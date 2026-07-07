"use client";

import { StatusChip } from "@/components/ui/StatusChip";
import { checkStatusMeta } from "@/lib/domain/check";
import type { Check, Table, Waiter } from "@/types";

interface AdminTableCardProps {
  table: Table;
  check?: Check;
  waiters: Waiter[];
  /** Reassign the responsible waiter (manager-only operation). */
  onTransfer: (waiterId: string) => void;
}

export function AdminTableCard({
  table,
  check,
  waiters,
  onTransfer,
}: AdminTableCardProps) {
  const occupied = !!check;
  const meta = check
    ? checkStatusMeta(check.status)
    : { kind: "green" as const, label: "Livre" };

  return (
    <div
      className={`grid gap-3 rounded-[13px] border bg-white p-4 ${
        occupied ? "border-[#cfe1f5]" : "border-line"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[1.15rem] font-extrabold text-navy">
            Mesa {table.num}
          </div>
          <div className="mt-px text-[0.8rem] text-ink-muted">
            {table.seats} lugares
          </div>
        </div>
        <StatusChip kind={occupied ? meta.kind : "green"}>
          {occupied ? meta.label : "Livre"}
        </StatusChip>
      </div>

      <label className="grid gap-1.5">
        <span className="text-[0.72rem] font-bold uppercase tracking-[0.06em] text-ink-muted">
          Responsável
        </span>
        <select
          value={check?.waiterId ?? ""}
          onChange={(e) => e.target.value && onTransfer(e.target.value)}
          disabled={!occupied}
          className={`h-10 w-full rounded-[9px] border border-[#dbe2ea] px-2.5 text-[0.88rem] ${
            occupied ? "bg-white text-navy" : "cursor-not-allowed bg-[#f8fafc] text-[#94a3b8]"
          }`}
        >
          {!occupied && <option value="">— Livre —</option>}
          {waiters
            .filter((w) => w.role === "waiter")
            .map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
        </select>
      </label>
    </div>
  );
}
