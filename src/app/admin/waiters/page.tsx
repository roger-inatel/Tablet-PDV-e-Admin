"use client";

import { useMemo, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import {
  WaiterEditDrawer,
  type WaiterFormData,
} from "@/components/admin/WaiterEditDrawer";
import { Avatar } from "@/components/ui/Avatar";
import { StatusChip } from "@/components/ui/StatusChip";
import { Loader } from "@/components/ui/Loader";
import { useAppStore } from "@/store/useAppStore";
import { waiterStatusMeta, waiterTableCount } from "@/store/selectors";
import type { Waiter } from "@/types";

type DrawerState = { mode: "edit"; waiter: Waiter } | { mode: "create" } | null;

export default function AdminWaitersPage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const waiters = useAppStore((s) => s.waiters);
  const checks = useAppStore((s) => s.checks);
  const saveWaiter = useAppStore((s) => s.saveWaiter);
  const createWaiter = useAppStore((s) => s.createWaiter);

  const [drawer, setDrawer] = useState<DrawerState>(null);

  const rows = useMemo(
    () =>
      waiters
        .filter((w) => w.role === "waiter")
        .map((w) => ({
          waiter: w,
          tableCount: waiterTableCount(checks, w.id),
          statusMeta: waiterStatusMeta(w.status),
        })),
    [waiters, checks],
  );

  const onSave = async (data: WaiterFormData) => {
    if (drawer?.mode === "edit") {
      await saveWaiter(drawer.waiter.id, {
        name: data.name,
        login: data.login,
        status: data.status,
        phone: data.phone,
        note: data.note,
      });
    } else {
      await createWaiter(data);
    }
    setDrawer(null);
  };

  return (
    <>
      <AdminHeader kicker="Cadastros" title="Garçons" />
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-5 md:px-6 lg:px-8">
        {!hydrated ? (
          <Loader />
        ) : (
          <div className="grid gap-4 animate-[mfade_.22s_ease]">
            <div className="flex flex-wrap items-center justify-between gap-3.5 rounded-card border border-line bg-white px-5 py-4">
              <div>
                <h2 className="m-0 mb-0.5 text-[1.08rem] text-navy">Equipe de garçons</h2>
                <p className="m-0 text-[0.88rem] text-ink-muted">
                  Cadastre garçons, defina o status e acompanhe a carga de mesas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrawer({ mode: "create" })}
                className="inline-flex items-center gap-1.5 rounded-[9px] bg-brand-900 px-[15px] py-2.5 text-[0.88rem] font-bold text-white"
              >
                + Novo garçom
              </button>
            </div>

            {/* Mobile: cards */}
            <div className="grid gap-3 md:hidden">
              {rows.map(({ waiter: w, tableCount, statusMeta }) => (
                <div
                  key={w.id}
                  className="grid gap-3 rounded-card border border-line bg-white p-4"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar initials={w.initials} color={w.color} size={38} />
                    <div className="grid min-w-0 gap-px">
                      <strong className="text-[0.95rem] text-navy">{w.name}</strong>
                      <span className="text-[0.78rem] text-ink-muted">
                        {w.roleLabel}
                      </span>
                    </div>
                    <StatusChip kind={statusMeta.kind} className="ml-auto">
                      {statusMeta.label}
                    </StatusChip>
                  </div>
                  <div className="flex items-center justify-between text-[0.84rem] text-[#475569]">
                    <span>
                      <span className="font-semibold text-navy">{w.login}</span> · PIN
                      ••••
                    </span>
                    <span className="font-semibold">{tableCount} mesas</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawer({ mode: "edit", waiter: w })}
                    className="rounded-lg border border-[#dbe2ea] bg-white py-2.5 text-[0.85rem] font-bold text-[#334155]"
                  >
                    Editar
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop/tablet: table */}
            <div className="hidden overflow-x-auto rounded-card border border-line bg-white p-1.5 md:block">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {["Garçom", "Login / PIN", "Mesas atribuídas", "Status", "Ações"].map(
                      (h, i) => (
                        <th
                          key={h}
                          className={`border-b border-line bg-[#f8fafc] px-3.5 py-3 text-[0.78rem] font-bold text-[#334155] ${
                            i <= 1 ? "text-left" : i === 4 ? "text-right" : "text-center"
                          }`}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ waiter: w, tableCount, statusMeta }) => (
                    <tr key={w.id} className="border-b border-[#eef1f6]">
                      <td className="px-3.5 py-[13px]">
                        <span className="inline-flex items-center gap-2.5">
                          <Avatar initials={w.initials} color={w.color} size={34} />
                          <span className="grid gap-px">
                            <strong className="text-[0.9rem] text-navy">{w.name}</strong>
                            <span className="text-[0.76rem] text-ink-muted">
                              {w.roleLabel}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td className="px-3.5 py-[13px] text-[0.88rem] text-[#475569]">
                        <span className="font-semibold text-navy">{w.login}</span> · PIN
                        ••••
                      </td>
                      <td className="px-3.5 py-[13px] text-center text-[0.9rem] font-semibold text-[#475569]">
                        {tableCount}
                      </td>
                      <td className="px-3.5 py-[13px] text-center">
                        <StatusChip kind={statusMeta.kind}>{statusMeta.label}</StatusChip>
                      </td>
                      <td className="px-3.5 py-[13px] text-right">
                        <button
                          type="button"
                          onClick={() => setDrawer({ mode: "edit", waiter: w })}
                          className="rounded-lg border border-[#dbe2ea] bg-white px-3 py-1.5 text-[0.82rem] font-semibold text-[#334155]"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {drawer && (
        <WaiterEditDrawer
          waiter={drawer.mode === "edit" ? drawer.waiter : null}
          onClose={() => setDrawer(null)}
          onSave={onSave}
        />
      )}
    </>
  );
}
