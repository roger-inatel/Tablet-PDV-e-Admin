"use client";

import { useMemo } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { SessionBadge } from "@/components/shell/SessionBadge";
import { useAppStore } from "@/store/useAppStore";
import { garconsById, mesaViews, minhasMesasCount } from "@/store/selectors";
import { firstName } from "@/lib/format";

export function GarcomHeader() {
  const sessao = useAppStore((s) => s.sessao);
  const garcons = useAppStore((s) => s.garcons);
  const mesas = useAppStore((s) => s.mesas);
  const comandas = useAppStore((s) => s.comandas);
  const pedidos = useAppStore((s) => s.pedidos);

  const garcom =
    sessao && sessao.papel !== "estacao"
      ? garconsById(garcons)[sessao.garcomId]
      : undefined;

  const minhas = useMemo(
    () => minhasMesasCount(mesaViews(mesas, comandas, pedidos, garcons, sessao)),
    [mesas, comandas, pedidos, garcons, sessao],
  );

  return (
    <div className="pdv-chrome flex items-center justify-between gap-2 border-b border-line bg-white px-4 py-3.5 md:px-6 md:py-4 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar
          initials={garcom?.initials ?? ""}
          color={garcom?.color ?? "#94a3b8"}
          size={40}
        />
        <div className="min-w-0">
          <div className="truncate text-[1.05rem] font-extrabold text-navy">
            Olá, {garcom ? firstName(garcom.name) : ""}
          </div>
          <div className="truncate text-[0.82rem] text-ink-muted">
            {garcom?.cargo ?? ""} · Bistrô Central
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        <div className="mr-1 hidden text-right leading-tight sm:block">
          <div className="text-[0.78rem] text-ink-muted">Suas mesas</div>
          <div className="text-[1.05rem] font-extrabold text-[#1f4e79]">{minhas}</div>
        </div>
        <SessionBadge />
      </div>
    </div>
  );
}
