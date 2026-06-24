"use client";

import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import { total as totalOf } from "@/lib/domain/comanda";
import { fmt } from "@/lib/format";
import { waitersById } from "@/store/selectors";
import type { ChipKind, Table, Waiter } from "@/types";

interface MesaCardProps {
  table: Table;
  currentWaiterId: string | null;
  waiters: Waiter[];
  detailed: boolean;
  onClick: () => void;
}

export function MesaCard({
  table,
  currentWaiterId,
  waiters,
  detailed,
  onClick,
}: MesaCardProps) {
  const free = table.status === "livre";
  const mine = table.status === "ocupada" && table.waiterId === currentWaiterId;
  const locked = table.status === "ocupada" && table.waiterId !== currentWaiterId;
  const w = table.waiterId ? waitersById(waiters)[table.waiterId] : undefined;

  let accent = "#16a34a";
  let chipKind: ChipKind = "green";
  let chipLabel = "Livre";
  if (mine) {
    accent = "#2563eb";
    chipKind = "blue";
    chipLabel = "Ocupada";
  }
  if (locked) {
    accent = "#dc2626";
    chipKind = "red";
    chipLabel = "Bloqueada";
  }

  const itemCount = table.items.reduce((a, i) => a + i.qty, 0);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-2 rounded-[14px] border border-line text-left ${
        locked ? "cursor-not-allowed bg-[#fcfbfb] opacity-[.82]" : "cursor-pointer bg-white"
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
            <div className="flex items-center gap-1.5 rounded-[9px] bg-[#fef2f2] px-2.5 py-2 text-[0.8rem] font-semibold text-[#991b1b]">
              <Icon name="lock" size={14} strokeWidth={2.4} />
              {w?.name}
            </div>
          )}
          {mine && (
            <div className="flex items-center justify-between border-t border-dashed border-[#dbe2ea] pt-2">
              <span className="text-[0.8rem] text-ink-muted">{itemCount} itens</span>
              <strong className="text-[0.96rem] text-[#1f4e79]">
                {fmt(totalOf(table.items))}
              </strong>
            </div>
          )}
          {free && (
            <div className="border-t border-dashed border-[#dbe2ea] pt-2 text-[0.82rem] font-bold text-[#16a34a]">
              Toque para abrir →
            </div>
          )}
        </div>
      )}
    </button>
  );
}
