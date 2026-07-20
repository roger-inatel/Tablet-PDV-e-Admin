"use client";

import type { AuditFilters } from "@/lib/audit";
import type { Waiter } from "@/types";

interface AuditFilterBarProps {
  filters: AuditFilters;
  waiters: Waiter[];
  onChange: (patch: Partial<AuditFilters>) => void;
  onClear: () => void;
}

const inputCls =
  "rounded-[9px] border border-line bg-white px-2.5 py-2 text-[0.86rem] text-navy outline-none focus:border-brand-600";

export function AuditFilterBar({
  filters,
  waiters,
  onChange,
  onClear,
}: AuditFilterBarProps) {
  return (
    <div className="grid gap-3 rounded-card border border-line bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <label className="grid gap-1 text-[0.72rem] font-bold uppercase tracking-[0.04em] text-ink-muted">
          De
          <input
            type="date"
            value={filters.from ?? ""}
            onChange={(e) => onChange({ from: e.target.value || undefined })}
            className={inputCls}
          />
        </label>
        <label className="grid gap-1 text-[0.72rem] font-bold uppercase tracking-[0.04em] text-ink-muted">
          Até
          <input
            type="date"
            value={filters.to ?? ""}
            onChange={(e) => onChange({ to: e.target.value || undefined })}
            className={inputCls}
          />
        </label>
        <label className="grid gap-1 text-[0.72rem] font-bold uppercase tracking-[0.04em] text-ink-muted">
          Funcionário
          <select
            value={filters.waiterId ?? ""}
            onChange={(e) => onChange({ waiterId: e.target.value || undefined })}
            className={inputCls}
          >
            <option value="">Todos</option>
            {waiters.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-[0.72rem] font-bold uppercase tracking-[0.04em] text-ink-muted">
          Mesa
          <input
            type="number"
            min={1}
            value={filters.tableNum ?? ""}
            onChange={(e) =>
              onChange({
                tableNum: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className={inputCls}
          />
        </label>
        <label className="grid gap-1 text-[0.72rem] font-bold uppercase tracking-[0.04em] text-ink-muted">
          Produto
          <input
            type="text"
            value={filters.product ?? ""}
            onChange={(e) => onChange({ product: e.target.value || undefined })}
            placeholder="Nome do item"
            className={inputCls}
          />
        </label>
        <label className="grid gap-1 text-[0.72rem] font-bold uppercase tracking-[0.04em] text-ink-muted">
          Status
          <select
            value={filters.status ?? "ALL"}
            onChange={(e) =>
              onChange({ status: e.target.value as AuditFilters["status"] })
            }
            className={inputCls}
          >
            <option value="ALL">Todos</option>
            <option value="APPROVED">Aprovado</option>
            <option value="REJECTED">Rejeitado</option>
            <option value="PENDING">Pendente</option>
          </select>
        </label>
      </div>
      <div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-[9px] border border-[#dbe2ea] bg-white px-3.5 py-2 text-[0.82rem] font-bold text-[#334155]"
        >
          Limpar filtros
        </button>
      </div>
    </div>
  );
}
