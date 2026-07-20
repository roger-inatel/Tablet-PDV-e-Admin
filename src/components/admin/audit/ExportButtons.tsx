"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { exportAuditExcel, exportAuditPdf } from "@/lib/audit/export";
import type { AuditRow } from "@/lib/audit";

/** Exports the FULL filtered set (not just the current page). */
export function ExportButtons({ rows }: { rows: AuditRow[] }) {
  const [busy, setBusy] = useState<"xlsx" | "pdf" | null>(null);
  const disabled = rows.length === 0 || busy !== null;

  const run = async (kind: "xlsx" | "pdf") => {
    setBusy(kind);
    try {
      if (kind === "xlsx") await exportAuditExcel(rows);
      else await exportAuditPdf(rows);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => run("xlsx")}
        className="inline-flex items-center gap-1.5 rounded-[9px] border border-[#bbf7d0] bg-[#f0fdf4] px-3.5 py-2 text-[0.84rem] font-bold text-[#166534] disabled:opacity-50"
      >
        <Icon name="box" size={14} />
        {busy === "xlsx" ? "Gerando…" : "Exportar Excel"}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => run("pdf")}
        className="inline-flex items-center gap-1.5 rounded-[9px] border border-[#fecaca] bg-[#fef2f2] px-3.5 py-2 text-[0.84rem] font-bold text-[#991b1b] disabled:opacity-50"
      >
        <Icon name="printer" size={14} />
        {busy === "pdf" ? "Gerando…" : "Exportar PDF"}
      </button>
    </div>
  );
}
