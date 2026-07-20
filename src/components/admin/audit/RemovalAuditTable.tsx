"use client";

import { StatusChip } from "@/components/ui/StatusChip";
import {
  AUDIT_STATUS_LABEL,
  auditDateTime,
  type AuditRow,
} from "@/lib/audit";
import { fmt } from "@/lib/format";
import type { ChipKind, RemovalStatus } from "@/types";

const CHIP: Record<RemovalStatus, ChipKind> = {
  PENDING: "amber",
  APPROVED: "green",
  REJECTED: "red",
};

export function RemovalAuditTable({ rows }: { rows: AuditRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-line bg-white px-5 py-12 text-center text-[0.9rem] text-ink-muted">
        Nenhum registro de remoção para os filtros selecionados.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-card border border-line bg-white">
      <table className="w-full border-collapse text-[0.84rem]">
        <thead>
          <tr className="border-b border-line bg-[#fbfcfe] text-left text-[0.7rem] uppercase tracking-[0.04em] text-ink-muted">
            <th className="px-3 py-2.5 font-bold">Mesa</th>
            <th className="px-3 py-2.5 font-bold">Item</th>
            <th className="px-3 py-2.5 text-right font-bold">Qtd</th>
            <th className="px-3 py-2.5 text-right font-bold">Valor</th>
            <th className="px-3 py-2.5 font-bold">Motivo</th>
            <th className="px-3 py-2.5 font-bold">Solicitante</th>
            <th className="px-3 py-2.5 font-bold">Aprovador</th>
            <th className="px-3 py-2.5 font-bold">Data/Hora</th>
            <th className="px-3 py-2.5 font-bold">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-[#f1f5f9] last:border-0">
              <td className="px-3 py-2.5 font-bold text-navy">{r.tableNum}</td>
              <td className="px-3 py-2.5 text-navy">
                {r.qty > 1 ? `${r.qty}× ${r.itemName}` : r.itemName}
              </td>
              <td className="px-3 py-2.5 text-right text-navy">{r.qty}</td>
              <td className="px-3 py-2.5 text-right font-semibold text-navy">
                {fmt(r.amount)}
              </td>
              <td className="max-w-[240px] px-3 py-2.5 text-ink-muted">{r.reason}</td>
              <td className="px-3 py-2.5 text-navy">{r.requesterName}</td>
              <td className="px-3 py-2.5 text-navy">{r.approverName}</td>
              <td className="px-3 py-2.5 text-ink-muted">
                {auditDateTime(r.decidedAt ?? r.requestedAt)}
              </td>
              <td className="px-3 py-2.5">
                <StatusChip kind={CHIP[r.status]}>
                  {AUDIT_STATUS_LABEL[r.status]}
                </StatusChip>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
