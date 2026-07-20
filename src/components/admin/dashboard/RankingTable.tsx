"use client";

import type { ReactNode } from "react";

export interface RankingColumn<T> {
  header: string;
  render: (row: T, index: number) => ReactNode;
  align?: "left" | "right";
  className?: string;
}

interface RankingTableProps<T> {
  rows: T[];
  columns: RankingColumn<T>[];
  emptyLabel: string;
  keyOf: (row: T, index: number) => string;
}

/** Compact ranking table (products, waiters, removal reasons…). */
export function RankingTable<T>({
  rows,
  columns,
  emptyLabel,
  keyOf,
}: RankingTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="px-1 py-8 text-center text-[0.88rem] text-ink-muted">
        {emptyLabel}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[0.86rem]">
        <thead>
          <tr className="border-b border-line text-left text-[0.72rem] uppercase tracking-[0.04em] text-ink-muted">
            <th className="py-2 pr-2 font-bold">#</th>
            {columns.map((c) => (
              <th
                key={c.header}
                className={`py-2 pr-2 font-bold ${c.align === "right" ? "text-right" : ""}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={keyOf(row, i)} className="border-b border-[#f1f5f9] last:border-0">
              <td className="py-2 pr-2 font-bold text-ink-muted">{i + 1}</td>
              {columns.map((c) => (
                <td
                  key={c.header}
                  className={`py-2 pr-2 text-navy ${c.align === "right" ? "text-right" : ""} ${c.className ?? ""}`}
                >
                  {c.render(row, i)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
