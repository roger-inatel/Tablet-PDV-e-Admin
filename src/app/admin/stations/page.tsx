"use client";

import { useMemo } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StationCard } from "@/components/admin/StationCard";
import { Loader } from "@/components/ui/Loader";
import { useAppStore } from "@/store/useAppStore";
import { kdsQueue } from "@/store/selectors";

export default function AdminStationsPage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const stations = useAppStore((s) => s.stations);
  const orders = useAppStore((s) => s.orders);

  const queues = useMemo(
    () =>
      Object.fromEntries(
        stations.map((st) => [
          st.id,
          kdsQueue(orders, st.id).filter((c) => c.stage !== "READY").length,
        ]),
      ),
    [stations, orders],
  );

  return (
    <>
      <AdminHeader kicker="Sistema" title="Setores & estações" />
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-5 md:px-6 lg:px-8">
        {!hydrated ? (
          <Loader />
        ) : (
          <div className="grid gap-4 animate-[mfade_.22s_ease]">
            <div className="rounded-card border border-line bg-white px-5 py-4">
              <h2 className="m-0 mb-0.5 text-[1.08rem] text-navy">
                Roteamento por estação
              </h2>
              <p className="m-0 text-[0.88rem] text-ink-muted">
                Cada categoria do cardápio é roteada para uma estação de preparo.
                Os pedidos chegam nos tablets KDS — sem impressoras.
              </p>
            </div>

            <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
              {stations.map((st) => (
                <StationCard key={st.id} station={st} activeQueue={queues[st.id] ?? 0} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
