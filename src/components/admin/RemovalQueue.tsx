"use client";

import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { StatusChip } from "@/components/ui/StatusChip";
import { useAppStore } from "@/store/useAppStore";
import { waitersById } from "@/store/selectors";
import { fmt } from "@/lib/format";
import type { ChipKind, RemovalRequest, RemovalStatus } from "@/types";

function statusMeta(status: RemovalStatus): { kind: ChipKind; label: string } {
  switch (status) {
    case "PENDING":
      return { kind: "amber", label: "Pendente" };
    case "APPROVED":
      return { kind: "green", label: "Aprovado" };
    case "REJECTED":
      return { kind: "red", label: "Rejeitado" };
  }
}

function dateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RemovalQueue() {
  const removals = useAppStore((s) => s.removals);
  const waiters = useAppStore((s) => s.waiters);
  const approveRemoval = useAppStore((s) => s.approveRemoval);
  const rejectRemoval = useAppStore((s) => s.rejectRemoval);

  const byId = useMemo(() => waitersById(waiters), [waiters]);
  const [busy, setBusy] = useState<string | null>(null);

  const { pending, decided } = useMemo(() => {
    const sorted = [...removals].sort(
      (a, b) =>
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
    );
    return {
      pending: sorted.filter((r) => r.status === "PENDING"),
      decided: sorted.filter((r) => r.status !== "PENDING"),
    };
  }, [removals]);

  const decide = async (r: RemovalRequest, action: "approve" | "reject") => {
    setBusy(r.id);
    if (action === "approve") await approveRemoval(r.id);
    else await rejectRemoval(r.id);
    setBusy(null);
  };

  return (
    <div className="grid gap-5 animate-[mfade_.22s_ease]">
      <section className="grid gap-2.5">
        <div className="flex items-center gap-2">
          <h2 className="m-0 text-[1.08rem] text-navy">Remoções pendentes</h2>
          <StatusChip kind={pending.length ? "amber" : "neutral"}>
            {pending.length}
          </StatusChip>
        </div>

        {pending.length === 0 ? (
          <div className="rounded-card border border-dashed border-line bg-white px-5 py-10 text-center text-[0.9rem] text-ink-muted">
            Nenhuma solicitação de remoção pendente.
          </div>
        ) : (
          pending.map((r) => {
            const w = byId[r.requestedByWaiterId];
            return (
              <div
                key={r.id}
                className="grid gap-3 rounded-card border border-[#fde68a] bg-[#fffbeb] px-4 py-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <strong className="text-[1rem] text-navy">Mesa {r.tableNum}</strong>
                    <StatusChip kind="amber">Pendente</StatusChip>
                  </div>
                  <strong className="text-[1.05rem] text-navy">{fmt(r.amount)}</strong>
                </div>

                <div className="text-[0.94rem] font-bold text-navy">
                  {r.qty > 1 ? `${r.qty}× ${r.itemName}` : r.itemName}
                </div>
                <div className="rounded-[10px] border border-[#fcd34d] bg-white px-3 py-2 text-[0.88rem] text-[#92400e]">
                  <span className="font-bold">Motivo:</span> {r.reason}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[0.82rem] text-ink-muted">
                  <span className="inline-flex items-center gap-2">
                    <Avatar
                      initials={w?.initials ?? "--"}
                      color={w?.color ?? "#94a3b8"}
                      size={22}
                    />
                    {w?.name ?? "—"} · {dateTime(r.requestedAt)}
                  </span>
                </div>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    disabled={busy === r.id}
                    onClick={() => decide(r, "reject")}
                    className="flex-1 rounded-[10px] border border-[#fecaca] bg-white py-2.5 text-[0.88rem] font-bold text-[#dc2626] disabled:opacity-50"
                  >
                    Rejeitar
                  </button>
                  <button
                    type="button"
                    disabled={busy === r.id}
                    onClick={() => decide(r, "approve")}
                    className="flex-1 rounded-[10px] bg-[#16a34a] py-2.5 text-[0.88rem] font-extrabold text-white disabled:opacity-50"
                  >
                    {busy === r.id ? "Processando…" : "Aprovar remoção"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>

      <section className="grid gap-2.5">
        <h2 className="m-0 text-[1.08rem] text-navy">Histórico recente</h2>
        {decided.length === 0 ? (
          <div className="rounded-card border border-dashed border-line bg-white px-5 py-8 text-center text-[0.9rem] text-ink-muted">
            Nenhuma remoção decidida ainda.
          </div>
        ) : (
          <div className="grid gap-2">
            {decided.slice(0, 30).map((r) => {
              const meta = statusMeta(r.status);
              const requester = byId[r.requestedByWaiterId];
              const approver = r.decidedByManagerId
                ? byId[r.decidedByManagerId]
                : undefined;
              return (
                <div
                  key={r.id}
                  className="grid gap-1.5 rounded-card border border-line bg-white px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <strong className="text-[0.95rem] text-navy">
                        Mesa {r.tableNum}
                      </strong>
                      <StatusChip kind={meta.kind}>{meta.label}</StatusChip>
                      <span className="text-[0.88rem] text-ink-muted">
                        {r.qty > 1 ? `${r.qty}× ${r.itemName}` : r.itemName}
                      </span>
                    </div>
                    <strong className="text-[0.95rem] text-navy">{fmt(r.amount)}</strong>
                  </div>
                  <div className="text-[0.82rem] text-ink-muted">
                    <span className="font-semibold">Motivo:</span> {r.reason}
                  </div>
                  <div className="text-[0.8rem] text-ink-muted">
                    Solicitado por {requester?.name ?? "—"}
                    {approver ? ` · decidido por ${approver.name}` : ""}
                    {r.decidedAt ? ` · ${dateTime(r.decidedAt)}` : ""}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
