"use client";

import { useMemo, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AuditFilterBar } from "@/components/admin/audit/AuditFilterBar";
import { RemovalAuditTable } from "@/components/admin/audit/RemovalAuditTable";
import { ExportButtons } from "@/components/admin/audit/ExportButtons";
import { Loader } from "@/components/ui/Loader";
import { useAppStore } from "@/store/useAppStore";
import { filterAuditRows, toAuditRows, type AuditFilters } from "@/lib/audit";
import { useAuditRows } from "@/lib/audit/queries";

const PAGE_SIZE = 20;

export default function AdminAuditPage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const removals = useAppStore((s) => s.removals);
  const waiters = useAppStore((s) => s.waiters);

  const [filters, setFilters] = useState<AuditFilters>({ status: "ALL" });
  const [page, setPage] = useState(1);

  // Database is the source of truth for the permanent audit; the local records
  // are the fallback when it isn't configured/provisioned.
  const { data: dbAudit } = useAuditRows(filters);
  const fromDb = dbAudit?.available === true;

  const localRows = useMemo(() => toAuditRows(removals, waiters), [removals, waiters]);
  const filtered = useMemo(
    () => (fromDb ? (dbAudit?.rows ?? []) : filterAuditRows(localRows, filters)),
    [fromDb, dbAudit, localRows, filters],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageRows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const patch = (p: Partial<AuditFilters>) => {
    setFilters((f) => ({ ...f, ...p }));
    setPage(1);
  };
  const clear = () => {
    setFilters({ status: "ALL" });
    setPage(1);
  };

  return (
    <>
      <AdminHeader kicker="Gestão" title="Auditoria de remoções" />
      <div className="mx-auto grid w-full max-w-[1440px] gap-4 px-4 pb-24 pt-5 md:px-6 lg:px-8">
        {!hydrated ? (
          <Loader />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="m-0 text-[0.88rem] text-ink-muted">
                {filtered.length} registro(s) ·{" "}
                <span className={fromDb ? "text-[#166534]" : "text-[#92400e]"}>
                  {fromDb ? "banco de dados" : "registros locais"}
                </span>{" "}
                · nenhum registro de remoção é apagado.
              </p>
              <ExportButtons rows={filtered} />
            </div>

            <AuditFilterBar
              filters={filters}
              waiters={waiters}
              onChange={patch}
              onClear={clear}
            />

            <RemovalAuditTable rows={pageRows} />

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={current <= 1}
                  onClick={() => setPage(current - 1)}
                  className="rounded-[9px] border border-[#dbe2ea] bg-white px-3.5 py-2 text-[0.84rem] font-bold text-[#334155] disabled:opacity-40"
                >
                  ← Anterior
                </button>
                <span className="text-[0.86rem] font-semibold text-ink-muted">
                  Página {current} de {totalPages}
                </span>
                <button
                  type="button"
                  disabled={current >= totalPages}
                  onClick={() => setPage(current + 1)}
                  className="rounded-[9px] border border-[#dbe2ea] bg-white px-3.5 py-2 text-[0.84rem] font-bold text-[#334155] disabled:opacity-40"
                >
                  Próxima →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
