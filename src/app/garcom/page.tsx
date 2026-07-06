"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { GarcomHeader } from "@/components/garcom/GarcomHeader";
import { MesaCard } from "@/components/garcom/MesaCard";
import { MesaLegend } from "@/components/garcom/MesaLegend";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { useAppStore } from "@/store/useAppStore";
import { mesaViews, type MesaView } from "@/store/selectors";
import type { MesasVariant } from "@/types";

export default function GarcomMesasPage() {
  const router = useRouter();
  const sessao = useAppStore((s) => s.sessao);
  const mesas = useAppStore((s) => s.mesas);
  const comandas = useAppStore((s) => s.comandas);
  const pedidos = useAppStore((s) => s.pedidos);
  const garcons = useAppStore((s) => s.garcons);
  const mesasVariant = useAppStore((s) => s.mesasVariant);
  const setMesasVariant = useAppStore((s) => s.setMesasVariant);
  const abrirComanda = useAppStore((s) => s.abrirComanda);

  const detailed = mesasVariant === "detalhado";

  const views = useMemo(
    () => mesaViews(mesas, comandas, pedidos, garcons, sessao),
    [mesas, comandas, pedidos, garcons, sessao],
  );

  const onCardClick = async (view: MesaView) => {
    if (view.kind === "livre") {
      const comanda = await abrirComanda(view.mesa.id);
      if (comanda) router.push(`/garcom/mesa/${view.mesa.id}`);
      return;
    }
    // "minha" opens for edits; "outro" opens read-only (consulta).
    router.push(`/garcom/mesa/${view.mesa.id}`);
  };

  return (
    <div className="flex h-full flex-col">
      <GarcomHeader />

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-3.5 lg:px-8">
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <h2 className="m-0 text-[1.15rem] text-navy">Mesas</h2>
          <MesaLegend />
        </div>
        <SegmentedToggle<MesasVariant>
          value={mesasVariant}
          onChange={setMesasVariant}
          options={[
            { value: "detalhado", label: "Detalhado" },
            { value: "compacto", label: "Compacto" },
          ]}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-10 pt-1 md:px-6 lg:px-8">
        <div
          className="grid gap-[13px]"
          style={{
            gridTemplateColumns: `repeat(auto-fill,minmax(${
              detailed ? "208px" : "146px"
            },1fr))`,
          }}
        >
          {views.map((v) => (
            <MesaCard
              key={v.mesa.id}
              view={v}
              detailed={detailed}
              onClick={() => onCardClick(v)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
