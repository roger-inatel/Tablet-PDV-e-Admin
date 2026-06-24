"use client";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminMesaCard } from "@/components/admin/AdminMesaCard";
import { Loader } from "@/components/ui/Loader";
import { useAppStore } from "@/store/useAppStore";

export default function MesasAdminPage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const tables = useAppStore((s) => s.tables);
  const waiters = useAppStore((s) => s.waiters);
  const setResponsavel = useAppStore((s) => s.setResponsavel);
  const pushToast = useAppStore((s) => s.pushToast);

  return (
    <>
      <AdminHeader kicker="Operação" title="Mesas do salão" />
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-5 md:px-6 lg:px-8">
        {!hydrated ? (
          <Loader />
        ) : (
          <div className="grid gap-4 animate-[mfade_.22s_ease]">
            <div className="flex flex-wrap items-center justify-between gap-3.5 rounded-card border border-line bg-white px-5 py-4">
              <div>
                <h2 className="m-0 mb-0.5 text-[1.08rem] text-navy">Mesas do salão</h2>
                <p className="m-0 text-[0.88rem] text-ink-muted">
                  Cada mesa tem um responsável. Defina abaixo qual garçom opera cada mesa.
                </p>
              </div>
              <button
                type="button"
                onClick={() => pushToast("Nova mesa (demonstração)")}
                className="inline-flex items-center gap-1.5 rounded-[9px] bg-brand-900 px-[15px] py-2.5 text-[0.88rem] font-bold text-white"
              >
                + Nova mesa
              </button>
            </div>

            <div className="grid gap-[13px] [grid-template-columns:repeat(auto-fill,minmax(248px,1fr))]">
              {tables.map((t) => (
                <AdminMesaCard
                  key={t.id}
                  table={t}
                  waiters={waiters}
                  onAssign={(waiterId) => setResponsavel(t.id, waiterId || null)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
