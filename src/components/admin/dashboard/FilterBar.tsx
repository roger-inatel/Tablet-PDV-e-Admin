"use client";

import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { PERIOD_LABEL } from "@/lib/dashboard/queries";
import type { DashboardPeriodKey } from "@/lib/dashboard/types";

interface FilterBarProps {
  period: DashboardPeriodKey;
  onChange: (p: DashboardPeriodKey) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

const ORDER: DashboardPeriodKey[] = ["today", "7d", "30d", "month"];

export function FilterBar({ period, onChange, onRefresh, loading }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-white px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-[0.8rem] font-bold uppercase tracking-[0.05em] text-ink-muted">
          Período
        </span>
        <SegmentedToggle<DashboardPeriodKey>
          value={period}
          onChange={onChange}
          options={ORDER.map((k) => ({ value: k, label: PERIOD_LABEL[k] }))}
        />
      </div>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-[9px] border border-[#dbe2ea] bg-white px-3.5 py-2 text-[0.84rem] font-bold text-[#334155]"
        >
          {loading ? "Atualizando…" : "Atualizar"}
        </button>
      )}
    </div>
  );
}
