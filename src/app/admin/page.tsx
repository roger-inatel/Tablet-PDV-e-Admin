"use client";

import { useMemo } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { KpiCard } from "@/components/admin/KpiCard";
import { Avatar } from "@/components/ui/Avatar";
import { StatusChip } from "@/components/ui/StatusChip";
import { Loader } from "@/components/ui/Loader";
import { useAppStore } from "@/store/useAppStore";
import {
  activeChecks,
  activeWaiters,
  checksInCheckout,
  ordersOfCheck,
  outstandingTotal,
  waiterTableCount,
  waitersById,
} from "@/store/selectors";
import { checkStatusMeta } from "@/lib/domain/check";
import { checkTotal } from "@/lib/domain/order";
import { fmt, firstName } from "@/lib/format";

export default function DashboardPage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const tables = useAppStore((s) => s.tables);
  const checks = useAppStore((s) => s.checks);
  const orders = useAppStore((s) => s.orders);
  const waiters = useAppStore((s) => s.waiters);

  const data = useMemo(() => {
    const occupied = tables.filter((t) => t.checkId !== null);
    const free = tables.filter((t) => t.checkId === null);
    const active = activeChecks(checks);
    const inCheckout = checksInCheckout(checks);
    const activeStaff = activeWaiters(waiters);
    const byId = waitersById(waiters);
    const totalTables = tables.length || 1;

    const kpis = [
      {
        label: "Mesas ocupadas",
        value: `${occupied.length}/${tables.length}`,
        helper: `${free.length} mesas livres`,
        highlight: true,
      },
      {
        label: "Comandas abertas",
        value: String(active.length),
        helper: "em atendimento agora",
      },
      {
        label: "Em fechamento",
        value: String(inCheckout.length),
        helper: "aguardando pagamento",
      },
      {
        label: "Em aberto",
        value: fmt(outstandingTotal(checks, orders)),
        helper: "a receber nas mesas",
      },
    ];

    const rows = active.map((c) => {
      const w = byId[c.waiterId];
      const checkOrders = ordersOfCheck(orders, c.id);
      const items =
        c.draftItems.reduce((s, d) => s + d.qty, 0) +
        checkOrders.reduce((s, o) => s + o.items.reduce((a, i) => a + i.qty, 0), 0);
      const meta = checkStatusMeta(c.status);
      return {
        id: c.id,
        table: `Mesa ${c.tableNum}`,
        waiter: w ? firstName(w.name) : "—",
        initials: w?.initials ?? "--",
        color: w?.color ?? "#94a3b8",
        items,
        total: fmt(checkTotal(c, checkOrders)),
        meta,
      };
    });

    const bars = [
      { label: "Ocupadas", count: occupied.length, color: "#2563eb" },
      { label: "Livres", count: free.length, color: "#16a34a" },
    ].map((b) => ({
      ...b,
      width: `${Math.round((b.count / totalTables) * 100)}%`,
    }));

    const onDuty = activeStaff.map((w) => ({
      id: w.id,
      name: w.name,
      roleLabel: w.roleLabel,
      initials: w.initials,
      color: w.color,
      tableCount: waiterTableCount(checks, w.id),
    }));

    return { kpis, rows, bars, onDuty };
  }, [tables, checks, orders, waiters]);

  return (
    <>
      <AdminHeader kicker="Operação" title="Dashboard" />
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-5 md:px-6 lg:px-8">
        {!hydrated ? (
          <Loader />
        ) : (
          <div className="grid gap-[18px] animate-[mfade_.22s_ease]">
            {/* KPIs */}
            <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(210px,1fr))]">
              {data.kpis.map((k) => (
                <KpiCard key={k.label} {...k} />
              ))}
            </div>

            {/* Two-column body */}
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
              {/* Active checks */}
              <div className="rounded-card border border-line bg-white p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="m-0 text-[1.08rem] text-navy">Comandas ativas</h2>
                  <span className="text-[0.82rem] text-ink-muted">
                    {data.rows.length} em andamento
                  </span>
                </div>

                {/* Mobile: cards */}
                <div className="grid gap-2.5 md:hidden">
                  {data.rows.map((r) => (
                    <div
                      key={r.id}
                      className="grid gap-2 rounded-[11px] border border-line bg-[#fbfcfe] px-3.5 py-3"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-[0.95rem] text-navy">{r.table}</strong>
                        <StatusChip kind={r.meta.kind}>{r.meta.label}</StatusChip>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2 text-[0.86rem] text-[#475569]">
                          <Avatar initials={r.initials} color={r.color} size={24} />
                          {r.waiter}
                        </span>
                        <span className="text-[0.84rem] text-ink-muted">
                          {r.items} itens ·{" "}
                          <strong className="text-navy">{r.total}</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                  {data.rows.length === 0 && (
                    <div className="rounded-[11px] border border-line bg-white px-3.5 py-6 text-center text-[0.88rem] text-ink-muted">
                      Nenhuma comanda ativa no momento.
                    </div>
                  )}
                </div>

                {/* Desktop/tablet: table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        {["Mesa", "Garçom", "Itens", "Total", "Status"].map((h, i) => (
                          <th
                            key={h}
                            className={`border-b border-line bg-[#f8fafc] px-2.5 py-2.5 text-[0.78rem] font-bold text-[#334155] ${
                              i <= 1 ? "text-left" : i === 2 ? "text-center" : "text-right"
                            }`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map((r) => (
                        <tr key={r.id} className="border-b border-[#eef1f6]">
                          <td className="px-2.5 py-3 text-[0.9rem] font-bold text-navy">
                            {r.table}
                          </td>
                          <td className="px-2.5 py-3 text-[0.9rem]">
                            <span className="inline-flex items-center gap-2">
                              <Avatar initials={r.initials} color={r.color} size={26} />
                              {r.waiter}
                            </span>
                          </td>
                          <td className="px-2.5 py-3 text-center text-[0.9rem] text-[#475569]">
                            {r.items}
                          </td>
                          <td className="px-2.5 py-3 text-right text-[0.9rem] font-bold text-navy">
                            {r.total}
                          </td>
                          <td className="px-2.5 py-3 text-right">
                            <StatusChip kind={r.meta.kind}>{r.meta.label}</StatusChip>
                          </td>
                        </tr>
                      ))}
                      {data.rows.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-2.5 py-8 text-center text-[0.9rem] text-ink-muted"
                          >
                            Nenhuma comanda ativa no momento.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right column */}
              <div className="grid content-start gap-4 md:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-card border border-line bg-white p-5">
                  <h2 className="m-0 mb-3.5 text-[1.04rem] text-navy">Mesas por status</h2>
                  <div className="grid gap-[13px]">
                    {data.bars.map((b) => (
                      <div key={b.label} className="grid gap-1.5">
                        <div className="flex justify-between text-[0.85rem]">
                          <span className="font-semibold text-[#334155]">{b.label}</span>
                          <span className="text-ink-muted">{b.count}</span>
                        </div>
                        <div className="h-[9px] overflow-hidden rounded-full bg-[#eef1f6]">
                          <span
                            className="block h-full rounded-full"
                            style={{ width: b.width, background: b.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-card border border-line bg-white p-5">
                  <h2 className="m-0 mb-[13px] text-[1.04rem] text-navy">
                    Garçons em serviço
                  </h2>
                  <div className="grid gap-2.5">
                    {data.onDuty.map((w) => (
                      <div
                        key={w.id}
                        className="flex items-center gap-2.5 rounded-[10px] border border-[#eef1f6] bg-[#fbfcfe] px-2.5 py-2"
                      >
                        <Avatar initials={w.initials} color={w.color} size={32} />
                        <div className="grid min-w-0 flex-1 gap-px">
                          <strong className="text-[0.86rem] text-navy">{w.name}</strong>
                          <span className="text-[0.76rem] text-ink-muted">
                            {w.roleLabel}
                          </span>
                        </div>
                        <span className="text-[0.8rem] font-semibold text-[#475569]">
                          {w.tableCount} mesas
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
