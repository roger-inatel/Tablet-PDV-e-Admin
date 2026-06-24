"use client";

import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import type { ChipKind, ComandaVariant } from "@/types";

interface SummaryChip {
  kind: ChipKind;
  label: string;
  count: number;
}

interface ComandaHeaderProps {
  tableNum: number;
  seats: number;
  waiterFirst: string;
  summary: SummaryChip[];
  variant: ComandaVariant;
  onVariant: (v: ComandaVariant) => void;
  onBack: () => void;
  /** Only show the Dividido/Foco toggle when the side panel layout is available. */
  showToggle: boolean;
}

export function ComandaHeader({
  tableNum,
  seats,
  waiterFirst,
  summary,
  variant,
  onVariant,
  onBack,
  showToggle,
}: ComandaHeaderProps) {
  return (
    <div className="pdv-chrome flex flex-col gap-2.5 border-b border-line bg-white px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6 md:py-3.5 lg:px-8">
      <div className="flex items-center gap-3 md:gap-3.5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-[10px] border border-[#dbe2ea] bg-white px-3 py-2.5 text-[0.86rem] font-bold text-[#475569]"
        >
          <Icon name="back" size={16} /> Mesas
        </button>
        <div className="min-w-0">
          <div className="text-[1.2rem] font-extrabold text-navy">Mesa {tableNum}</div>
          <div className="text-[0.82rem] text-ink-muted">
            {seats} lugares · {waiterFirst}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        {summary.map((s) => (
          <StatusChip key={s.label} kind={s.kind}>
            {s.count} {s.label}
          </StatusChip>
        ))}
        {showToggle && (
          <SegmentedToggle<ComandaVariant>
            value={variant}
            onChange={onVariant}
            options={[
              { value: "dividido", label: "Dividido" },
              { value: "foco", label: "Foco" },
            ]}
          />
        )}
      </div>
    </div>
  );
}
