"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmt } from "@/lib/format";
import type { SalesPoint } from "@/lib/dashboard/types";

function shortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

/** Revenue (bars) + order count (line) per day. */
export function SalesChart({ data }: { data: SalesPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-[0.9rem] text-ink-muted">
        Sem vendas no período.
      </div>
    );
  }
  const rows = data.map((p) => ({ ...p, label: shortDate(p.date) }));

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} />
          <YAxis
            yAxisId="rev"
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
            width={54}
            tickFormatter={(v) => `R$${v}`}
          />
          <YAxis
            yAxisId="ord"
            orientation="right"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            width={28}
            allowDecimals={false}
          />
          <Tooltip
            formatter={(value, name) =>
              name === "Faturamento" ? fmt(Number(value)) : Number(value)
            }
            labelStyle={{ fontWeight: 700, color: "#0f172a" }}
            contentStyle={{ borderRadius: 10, border: "1px solid #e5e9f0", fontSize: 12 }}
          />
          <Bar
            yAxisId="rev"
            dataKey="revenue"
            name="Faturamento"
            fill="#2563eb"
            radius={[5, 5, 0, 0]}
            maxBarSize={44}
          />
          <Line
            yAxisId="ord"
            type="monotone"
            dataKey="orders"
            name="Pedidos"
            stroke="#16a34a"
            strokeWidth={2.5}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
