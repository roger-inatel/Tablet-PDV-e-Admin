"use client";

import type { HeatCell } from "@/lib/dashboard/types";

// SQL Server DATEPART(WEEKDAY) with default DATEFIRST=7 → 1=Sunday..7=Saturday.
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const HOURS = Array.from({ length: 24 }, (_, h) => h);

/** Movement heatmap: weekday (rows) × hour (cols), colored by order count. */
export function Heatmap({ data }: { data: HeatCell[] }) {
  const max = data.reduce((m, c) => Math.max(m, c.orders), 0);
  const lookup = new Map<string, number>();
  for (const c of data) lookup.set(`${c.weekday}-${c.hour}`, c.orders);

  if (max === 0) {
    return (
      <div className="flex h-[160px] items-center justify-center text-[0.9rem] text-ink-muted">
        Sem movimento no período.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-[34px_repeat(24,1fr)] gap-[3px]">
          <div />
          {HOURS.map((h) => (
            <div key={h} className="text-center text-[0.6rem] text-ink-muted">
              {h % 3 === 0 ? h : ""}
            </div>
          ))}
          {WEEKDAYS.map((label, row) => (
            <FragmentRow
              key={label}
              label={label}
              weekday={row + 1}
              lookup={lookup}
              max={max}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[0.7rem] text-ink-muted">
          <span>menos</span>
          {[0.15, 0.4, 0.65, 0.9].map((o) => (
            <span
              key={o}
              className="h-3 w-4 rounded-[3px]"
              style={{ background: `rgba(37,99,235,${o})` }}
            />
          ))}
          <span>mais</span>
        </div>
      </div>
    </div>
  );
}

function FragmentRow({
  label,
  weekday,
  lookup,
  max,
}: {
  label: string;
  weekday: number;
  lookup: Map<string, number>;
  max: number;
}) {
  return (
    <>
      <div className="flex items-center text-[0.68rem] font-bold text-ink-muted">
        {label}
      </div>
      {HOURS.map((h) => {
        const orders = lookup.get(`${weekday}-${h}`) ?? 0;
        const intensity = orders === 0 ? 0 : 0.15 + 0.85 * (orders / max);
        return (
          <div
            key={h}
            title={`${label} ${h}h · ${orders} pedido(s)`}
            className="aspect-square rounded-[3px] border border-[#eef1f6]"
            style={{ background: orders ? `rgba(37,99,235,${intensity})` : "#f8fafc" }}
          />
        );
      })}
    </>
  );
}
