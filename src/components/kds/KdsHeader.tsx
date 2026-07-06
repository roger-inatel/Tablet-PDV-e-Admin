"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { SessionBadge } from "@/components/shell/SessionBadge";
import { useAppStore } from "@/store/useAppStore";
import type { Estacao } from "@/types";

/** Live clock (client-only; the KDS pages render behind the hydration gate). */
function Relogio() {
  const [hora, setHora] = useState<string>(() =>
    new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  );
  useEffect(() => {
    const t = setInterval(
      () =>
        setHora(
          new Date().toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        ),
      10_000,
    );
    return () => clearInterval(t);
  }, []);
  return (
    <span className="hidden text-[1.2rem] font-extrabold tabular-nums text-slate-200 sm:block">
      {hora}
    </span>
  );
}

export function KdsHeader({ estacao }: { estacao: Estacao }) {
  const estacoes = useAppStore((s) => s.estacoes);
  const config = estacoes.find((e) => e.id === estacao);

  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-white"
          style={{ background: config?.cor ?? "#334155" }}
        >
          <Icon name={config?.icone ?? "flame"} size={19} />
        </span>
        <div className="min-w-0">
          <div className="truncate text-[1.1rem] font-extrabold text-white">
            KDS · {config?.nome ?? estacao}
          </div>
          <div className="truncate text-[0.8rem] text-slate-400">
            {config?.descricao}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Relogio />
        <SessionBadge dark />
      </div>
    </div>
  );
}
