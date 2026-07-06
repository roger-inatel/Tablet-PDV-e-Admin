"use client";

import { useMemo } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { EstacaoCard } from "@/components/admin/EstacaoCard";
import { Loader } from "@/components/ui/Loader";
import { useAppStore } from "@/store/useAppStore";
import { kdsQueue } from "@/store/selectors";

export default function SetoresPage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const estacoes = useAppStore((s) => s.estacoes);
  const pedidos = useAppStore((s) => s.pedidos);

  const filas = useMemo(
    () =>
      Object.fromEntries(
        estacoes.map((e) => [
          e.id,
          kdsQueue(pedidos, e.id).filter((c) => c.estagio !== "PRONTO").length,
        ]),
      ),
    [estacoes, pedidos],
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
              {estacoes.map((e) => (
                <EstacaoCard key={e.id} estacao={e} filaAtiva={filas[e.id] ?? 0} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
