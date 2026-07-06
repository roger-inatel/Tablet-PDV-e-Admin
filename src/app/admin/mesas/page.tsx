"use client";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminMesaCard } from "@/components/admin/AdminMesaCard";
import { Loader } from "@/components/ui/Loader";
import { useAppStore } from "@/store/useAppStore";
import { comandaById } from "@/store/selectors";

export default function MesasAdminPage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const mesas = useAppStore((s) => s.mesas);
  const comandas = useAppStore((s) => s.comandas);
  const garcons = useAppStore((s) => s.garcons);
  const transferirComanda = useAppStore((s) => s.transferirComanda);
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
                  A ocupação vem da comanda. Transfira o responsável quando necessário.
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
              {mesas.map((mesa) => {
                const comanda = comandaById(comandas, mesa.comandaId);
                return (
                  <AdminMesaCard
                    key={mesa.id}
                    mesa={mesa}
                    comanda={comanda}
                    garcons={garcons}
                    onTransferir={(garcomId) =>
                      comanda && transferirComanda(comanda.id, garcomId)
                    }
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
