"use client";

import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { orderItemStatusMeta } from "@/lib/domain/check";
import type { CheckVariant, ChipKind, OrderItemStatus } from "@/types";

interface CheckHeaderProps {
  tableNum: number;
  seats: number;
  waiterName: string;
  /** Read-only view of another waiter's check. */
  readOnly: boolean;
  counts: { toSend: number; byStatus: Record<OrderItemStatus, number> };
  variant: CheckVariant;
  onVariant: (v: CheckVariant) => void;
  onBack: () => void;
  showToggle: boolean;
}

export function CheckHeader({
  tableNum,
  seats,
  waiterName,
  readOnly,
  counts,
  variant,
  onVariant,
  onBack,
  showToggle,
}: CheckHeaderProps) {
  const chips: { kind: ChipKind; label: string; count: number }[] = [];
  if (counts.toSend > 0) {
    chips.push({ kind: "neutral", label: "a enviar", count: counts.toSend });
  }
  (Object.keys(counts.byStatus) as OrderItemStatus[]).forEach((st) => {
    const count = counts.byStatus[st];
    if (count > 0) {
      const meta = orderItemStatusMeta(st);
      chips.push({ kind: meta.kind, label: meta.label.toLowerCase(), count });
    }
  });

  return (
    <div className="pos-chrome flex flex-col gap-2.5 border-b border-line bg-white px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6 md:py-3.5 lg:px-8">
      <div className="flex items-center gap-3 md:gap-3.5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-[10px] border border-[#dbe2ea] bg-white px-3 py-2.5 text-[0.86rem] font-bold text-[#475569]"
        >
          <Icon name="back" size={16} /> Mesas
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-[1.2rem] font-extrabold text-navy">
              Mesa {tableNum}
            </div>
            {readOnly && (
              <StatusChip kind="neutral">
                <Icon name="lock" size={11} strokeWidth={2.4} />
                somente leitura
              </StatusChip>
            )}
          </div>
          <div className="truncate text-[0.82rem] text-ink-muted">
            {seats} lugares · {readOnly ? `Comanda de ${waiterName}` : waiterName}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        {chips.map((c) => (
          <StatusChip key={c.label} kind={c.kind}>
            {c.count} {c.label}
          </StatusChip>
        ))}
        {showToggle && !readOnly && (
          <SegmentedToggle<CheckVariant>
            value={variant}
            onChange={onVariant}
            options={[
              { value: "split", label: "Dividido" },
              { value: "focus", label: "Foco" },
            ]}
          />
        )}
      </div>
    </div>
  );
}
