"use client";

import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import { fmt } from "@/lib/format";
import type { DraftItem } from "@/types";

interface CheckDraftsProps {
  drafts: DraftItem[];
  /** When false the qty steppers are hidden (read-only / locked check). */
  editable: boolean;
  onInc: (key: string) => void;
  onDec: (key: string) => void;
}

/** "Itens a enviar" section — the pre-dispatch draft lines. */
export function CheckDrafts({ drafts, editable, onInc, onDec }: CheckDraftsProps) {
  if (drafts.length === 0) return null;

  return (
    <div>
      <div className="mb-2.5 flex items-center gap-2.5">
        <span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-status-neutral-bg text-status-neutral-fg">
          <Icon name="box" size={15} />
        </span>
        <strong className="text-[0.95rem] text-navy">Itens a enviar</strong>
        <span className="text-[0.78rem] text-[#94a3b8]">
          ainda não foram para as estações
        </span>
      </div>
      <div className="grid gap-2">
        {drafts.map((d) => (
          <div
            key={d.key}
            className="flex items-center gap-3 rounded-[11px] border border-dashed border-[#cbd5e1] bg-white px-[13px] py-[11px]"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-[0.94rem] font-bold text-navy">
                {d.qty > 1 ? `${d.qty}× ${d.name}` : d.name}
              </div>
              <div className="mt-[3px] flex flex-wrap items-center gap-x-2 gap-y-1">
                <StatusChip kind="neutral">
                  {d.station === "kitchen" ? "Cozinha" : "Bar"}
                </StatusChip>
                <span className="text-[0.8rem] text-ink-muted">
                  {fmt(d.unitPrice * d.qty)}
                </span>
              </div>
            </div>
            {editable && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onDec(d.key)}
                  className="h-[38px] w-[38px] rounded-[9px] border border-[#dbe2ea] bg-[#f8fafc] text-[1.2rem] font-bold leading-none text-[#475569]"
                >
                  −
                </button>
                <span className="min-w-[22px] text-center text-[1rem] font-extrabold text-navy">
                  {d.qty}
                </span>
                <button
                  type="button"
                  onClick={() => onInc(d.key)}
                  className="h-[38px] w-[38px] rounded-[9px] border border-[#cfe1f5] bg-[#eff6ff] text-[1.2rem] font-bold leading-none text-[#1f4e79]"
                >
                  +
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
