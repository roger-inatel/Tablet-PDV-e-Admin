"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import type { StationConfig } from "@/types";

interface StationCardProps {
  station: StationConfig;
  /** Orders currently in this station's queue (not fully ready). */
  activeQueue: number;
}

/** Station (KDS) card. */
export function StationCard({ station, activeQueue }: StationCardProps) {
  return (
    <div className="grid gap-3 rounded-card border border-line bg-white p-[18px]">
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <span
            className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] text-white"
            style={{ background: station.color }}
          >
            <Icon name={station.icon} size={18} />
          </span>
          <div>
            <strong className="block text-[1rem] text-navy">{station.name}</strong>
            <span className="text-[0.8rem] text-ink-muted">{station.description}</span>
          </div>
        </div>
        <StatusChip kind={activeQueue > 0 ? "blue" : "green"}>
          {activeQueue > 0 ? `${activeQueue} na fila` : "Sem fila"}
        </StatusChip>
      </div>

      <div className="grid gap-1.5">
        <span className="text-[0.72rem] font-bold uppercase tracking-[0.06em] text-ink-muted">
          Categorias roteadas
        </span>
        <div className="flex flex-wrap gap-1.5">
          {station.categories.map((c) => (
            <span
              key={c}
              className="rounded-[8px] border border-[#d7e0ea] bg-[#f8fafc] px-2.5 py-1 text-[0.78rem] font-semibold text-[#334155]"
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      <Link
        href={`/kds/${station.id}`}
        className="rounded-[9px] border border-[#dbe2ea] bg-[#f8fbff] py-2.5 text-center text-[0.84rem] font-bold text-[#1f4e79]"
      >
        Abrir KDS da estação →
      </Link>
    </div>
  );
}
