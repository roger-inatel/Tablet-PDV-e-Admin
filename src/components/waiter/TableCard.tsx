"use client";

import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import { fmt } from "@/lib/format";
import type { TableView } from "@/store/selectors";
import type { ChipKind } from "@/types";

interface TableCardProps {
  view: TableView;
  detailed: boolean;
  onClick: () => void;
}

export function TableCard({ view, detailed, onClick }: TableCardProps) {
  const { table, kind, waiter, total, itemCount, locked } = view;

  let accent = "#16a34a";
  let chipKind: ChipKind = "green";
  let chipLabel = "Livre";
  if (kind === "mine") {
    accent = "#2563eb";
    chipKind = "blue";
    chipLabel = "Sua mesa";
  }
  if (kind === "other") {
    accent = "#dc2626";
    chipKind = "red";
    chipLabel = "Ocupada";
  }
  // Checkout requested: the tile is the cashier's now — locked & read-only.
  if (locked) {
    accent = "#dc2626";
    chipKind = "red";
    chipLabel = "Aguardando pgto";
  }

  return (
    <button
      type="button"
      onClick={locked ? undefined : onClick}
      disabled={locked}
      aria-disabled={locked}
      className={`flex flex-col items-start gap-2 rounded-[14px] border border-line bg-white text-left ${
        locked ? "cursor-not-allowed opacity-60 grayscale-[0.4]" : ""
      }`}
      style={{
        borderLeft: `5px solid ${accent}`,
        padding: detailed ? 16 : 13,
        minHeight: detailed ? undefined : 84,
      }}
    >
      <div className="flex w-full items-start justify-between">
        <span className="text-[1.5rem] font-extrabold leading-none text-navy">
          {table.num}
        </span>
        <StatusChip kind={chipKind}>{chipLabel}</StatusChip>
      </div>
      <div className="w-full text-left text-[0.8rem] text-ink-muted">
        {table.seats} lugares
      </div>

      {detailed && (
        <div className="mt-0.5 w-full">
          {locked && (
            <div className="flex items-center justify-between gap-2 border-t border-dashed border-[#fecaca] pt-2">
              <span className="inline-flex min-w-0 items-center gap-1.5 text-[0.8rem] font-semibold text-[#991b1b]">
                <Icon name="lock" size={13} strokeWidth={2.4} />
                <span className="truncate">Aguardando pagamento no caixa</span>
              </span>
              <strong className="shrink-0 text-[0.9rem] text-[#991b1b]">{fmt(total)}</strong>
            </div>
          )}
          {!locked && kind === "other" && (
            <div className="flex items-center justify-between gap-2 border-t border-dashed border-[#dbe2ea] pt-2">
              <span className="inline-flex min-w-0 items-center gap-1.5 text-[0.8rem] font-semibold text-[#991b1b]">
                <Icon name="lock" size={13} strokeWidth={2.4} />
                <span className="truncate">{waiter?.name}</span>
              </span>
              <span className="shrink-0 text-[0.78rem] font-bold text-ink-muted">
                Ver →
              </span>
            </div>
          )}
          {!locked && kind === "mine" && (
            <div className="flex items-center justify-between border-t border-dashed border-[#dbe2ea] pt-2">
              <span className="text-[0.8rem] text-ink-muted">{itemCount} itens</span>
              <strong className="text-[0.96rem] text-[#1f4e79]">{fmt(total)}</strong>
            </div>
          )}
          {!locked && kind === "free" && (
            <div className="border-t border-dashed border-[#dbe2ea] pt-2 text-[0.82rem] font-bold text-[#16a34a]">
              Toque para abrir →
            </div>
          )}
        </div>
      )}
    </button>
  );
}
