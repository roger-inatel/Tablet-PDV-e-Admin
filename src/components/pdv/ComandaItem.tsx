"use client";

import { StatusChip } from "@/components/ui/StatusChip";
import { itemStatusMeta } from "@/lib/domain/comanda";
import { fmt } from "@/lib/format";
import type { ComandaItem as ComandaItemType } from "@/types";

interface ComandaItemProps {
  item: ComandaItemType;
  onInc: () => void;
  onDec: () => void;
  onAdvance: () => void;
}

export function ComandaItem({ item, onInc, onDec, onAdvance }: ComandaItemProps) {
  const meta = itemStatusMeta(item.status);
  const editable = item.status === "PENDENTE";
  const canAdvance = item.status === "ENVIADO" || item.status === "PREPARO";
  const advLabel =
    item.status === "ENVIADO"
      ? "Marcar preparo"
      : item.status === "PREPARO"
        ? "Marcar pronto"
        : "Pronto";
  const name = item.qty > 1 ? `${item.qty}× ${item.name}` : item.name;

  return (
    <div className="flex items-center gap-3 rounded-[11px] border border-line bg-white px-[13px] py-[11px]">
      <div className="min-w-0 flex-1">
        <div className="truncate text-[0.94rem] font-bold text-navy">{name}</div>
        <div className="mt-[3px] flex flex-wrap items-center gap-x-2 gap-y-1">
          <StatusChip kind={meta.kind}>{meta.label}</StatusChip>
          <span className="text-[0.8rem] text-ink-muted">{fmt(item.price * item.qty)}</span>
        </div>
      </div>

      {editable ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDec}
            className="h-[38px] w-[38px] rounded-[9px] border border-[#dbe2ea] bg-[#f8fafc] text-[1.2rem] font-bold leading-none text-[#475569]"
          >
            −
          </button>
          <span className="min-w-[22px] text-center text-[1rem] font-extrabold text-navy">
            {item.qty}
          </span>
          <button
            type="button"
            onClick={onInc}
            className="h-[38px] w-[38px] rounded-[9px] border border-[#cfe1f5] bg-[#eff6ff] text-[1.2rem] font-bold leading-none text-[#1f4e79]"
          >
            +
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2.5">
          <span className="text-[1rem] font-extrabold text-navy">{item.qty}×</span>
          <button
            type="button"
            onClick={canAdvance ? onAdvance : undefined}
            className={`whitespace-nowrap rounded-[9px] border px-3 py-[9px] text-[0.8rem] font-bold ${
              canAdvance
                ? "cursor-pointer border-[#cfe1f5] bg-[#f8fbff] text-[#1f4e79]"
                : "cursor-default border-[#dcfce7] bg-[#dcfce7] text-[#166534]"
            }`}
          >
            {advLabel}
          </button>
        </div>
      )}
    </div>
  );
}
