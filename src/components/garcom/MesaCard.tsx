"use client";

import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import { fmt } from "@/lib/format";
import type { MesaView } from "@/store/selectors";
import type { ChipKind } from "@/types";

interface MesaCardProps {
  view: MesaView;
  detailed: boolean;
  onClick: () => void;
}

export function MesaCard({ view, detailed, onClick }: MesaCardProps) {
  const { mesa, kind, garcom, total, itemCount, emFechamento } = view;

  let accent = "#16a34a";
  let chipKind: ChipKind = "green";
  let chipLabel = "Livre";
  if (kind === "minha") {
    accent = "#2563eb";
    chipKind = "blue";
    chipLabel = "Sua mesa";
  }
  if (kind === "outro") {
    accent = "#dc2626";
    chipKind = "red";
    chipLabel = "Ocupada";
  }
  if (emFechamento) {
    accent = "#d97706";
    chipKind = "amber";
    chipLabel = "Em fechamento";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start gap-2 rounded-[14px] border border-line bg-white text-left"
      style={{
        borderLeft: `5px solid ${accent}`,
        padding: detailed ? 16 : 13,
        minHeight: detailed ? undefined : 84,
      }}
    >
      <div className="flex w-full items-start justify-between">
        <span className="text-[1.5rem] font-extrabold leading-none text-navy">
          {mesa.num}
        </span>
        <StatusChip kind={chipKind}>{chipLabel}</StatusChip>
      </div>
      <div className="w-full text-left text-[0.8rem] text-ink-muted">
        {mesa.seats} lugares
      </div>

      {detailed && (
        <div className="mt-0.5 w-full">
          {kind === "outro" && (
            <div className="flex items-center justify-between gap-2 border-t border-dashed border-[#dbe2ea] pt-2">
              <span className="inline-flex min-w-0 items-center gap-1.5 text-[0.8rem] font-semibold text-[#991b1b]">
                <Icon name="lock" size={13} strokeWidth={2.4} />
                <span className="truncate">{garcom?.name}</span>
              </span>
              <span className="shrink-0 text-[0.78rem] font-bold text-ink-muted">
                Ver →
              </span>
            </div>
          )}
          {kind === "minha" && (
            <div className="flex items-center justify-between border-t border-dashed border-[#dbe2ea] pt-2">
              <span className="text-[0.8rem] text-ink-muted">{itemCount} itens</span>
              <strong className="text-[0.96rem] text-[#1f4e79]">{fmt(total)}</strong>
            </div>
          )}
          {kind === "livre" && (
            <div className="border-t border-dashed border-[#dbe2ea] pt-2 text-[0.82rem] font-bold text-[#16a34a]">
              Toque para abrir →
            </div>
          )}
        </div>
      )}
    </button>
  );
}
