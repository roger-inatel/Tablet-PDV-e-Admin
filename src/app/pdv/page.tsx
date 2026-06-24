"use client";

import { useRouter } from "next/navigation";
import { PdvHeader } from "@/components/pdv/PdvHeader";
import { MesaCard } from "@/components/pdv/MesaCard";
import { MesaLegend } from "@/components/pdv/MesaLegend";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { useAppStore } from "@/store/useAppStore";
import type { MesasVariant } from "@/types";

export default function PdvMesasPage() {
  const router = useRouter();
  const tables = useAppStore((s) => s.tables);
  const waiters = useAppStore((s) => s.waiters);
  const currentWaiterId = useAppStore((s) => s.currentWaiterId);
  const mesasVariant = useAppStore((s) => s.mesasVariant);
  const setMesasVariant = useAppStore((s) => s.setMesasVariant);
  const openTable = useAppStore((s) => s.openTable);
  const pushToast = useAppStore((s) => s.pushToast);

  const detailed = mesasVariant === "detalhado";

  const onCardClick = async (id: number) => {
    const res = await openTable(id);
    if (!res.ok) {
      if (res.blockedBy) pushToast(`Mesa de ${res.blockedBy} · bloqueada`);
      return;
    }
    router.push(`/pdv/mesa/${id}`);
  };

  return (
    <div className="flex h-full flex-col">
      <PdvHeader />

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

      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-1 md:px-6 lg:px-8">
        <div
          className="grid gap-[13px]"
          style={{
            gridTemplateColumns: `repeat(auto-fill,minmax(${
              detailed ? "208px" : "146px"
            },1fr))`,
          }}
        >
          {tables.map((t) => (
            <MesaCard
              key={t.id}
              table={t}
              currentWaiterId={currentWaiterId}
              waiters={waiters}
              detailed={detailed}
              onClick={() => onCardClick(t.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
