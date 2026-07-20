"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { fmt } from "@/lib/format";
import type { PaymentSlice } from "@/lib/dashboard/types";

const COLORS: Record<string, string> = {
  Dinheiro: "#16a34a",
  Cartão: "#2563eb",
  PIX: "#0d9488",
};
const FALLBACK = ["#7c3aed", "#b45309", "#be123c", "#0369a1"];

/** Payment method breakdown (split-accurate: sums TB_PEDIDO_PARCELA). */
export function PaymentPie({ data }: { data: PaymentSlice[] }) {
  const total = data.reduce((s, d) => s + d.total, 0);
  if (total === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center text-[0.9rem] text-ink-muted">
        Sem pagamentos no período.
      </div>
    );
  }

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="method"
            innerRadius={54}
            outerRadius={84}
            paddingAngle={2}
          >
            {data.map((d, i) => (
              <Cell key={d.method} fill={COLORS[d.method] ?? FALLBACK[i % FALLBACK.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [fmt(Number(value)), name]}
            contentStyle={{ borderRadius: 10, border: "1px solid #e5e9f0", fontSize: 12 }}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            formatter={(value) => (
              <span style={{ fontSize: 12, color: "#334155" }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
