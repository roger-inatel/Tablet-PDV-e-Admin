"use client";

import { StatusChip } from "@/components/ui/StatusChip";
import { comandaStatusMeta } from "@/lib/domain/comanda";
import type { Comanda, Garcom, Mesa } from "@/types";

interface AdminMesaCardProps {
  mesa: Mesa;
  comanda?: Comanda;
  garcons: Garcom[];
  /** Reassign the responsible waiter (gerente-only operation). */
  onTransferir: (garcomId: string) => void;
}

export function AdminMesaCard({
  mesa,
  comanda,
  garcons,
  onTransferir,
}: AdminMesaCardProps) {
  const ocupada = !!comanda;
  const meta = comanda
    ? comandaStatusMeta(comanda.status)
    : { kind: "green" as const, label: "Livre" };

  return (
    <div
      className={`grid gap-3 rounded-[13px] border bg-white p-4 ${
        ocupada ? "border-[#cfe1f5]" : "border-line"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[1.15rem] font-extrabold text-navy">Mesa {mesa.num}</div>
          <div className="mt-px text-[0.8rem] text-ink-muted">{mesa.seats} lugares</div>
        </div>
        <StatusChip kind={ocupada ? meta.kind : "green"}>
          {ocupada ? meta.label : "Livre"}
        </StatusChip>
      </div>

      <label className="grid gap-1.5">
        <span className="text-[0.72rem] font-bold uppercase tracking-[0.06em] text-ink-muted">
          Responsável
        </span>
        <select
          value={comanda?.garcomId ?? ""}
          onChange={(e) => e.target.value && onTransferir(e.target.value)}
          disabled={!ocupada}
          className={`h-10 w-full rounded-[9px] border border-[#dbe2ea] px-2.5 text-[0.88rem] ${
            ocupada ? "bg-white text-navy" : "cursor-not-allowed bg-[#f8fafc] text-[#94a3b8]"
          }`}
        >
          {!ocupada && <option value="">— Livre —</option>}
          {garcons
            .filter((g) => g.papel === "garcom")
            .map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
        </select>
      </label>
    </div>
  );
}
