"use client";

import { useEffect, useMemo, useState } from "react";
import { PedidoCard } from "./PedidoCard";
import { useAppStore } from "@/store/useAppStore";
import { garconsById, kdsQueue } from "@/store/selectors";
import { firstName } from "@/lib/format";
import type { Estacao, ItemPedidoStatus } from "@/types";

type Coluna = "RECEBIDO" | "EM_PREPARO" | "PRONTO";

const COLUNAS: { id: Coluna; titulo: string; accent: string }[] = [
  { id: "RECEBIDO", titulo: "Recebido", accent: "#f59e0b" },
  { id: "EM_PREPARO", titulo: "Em preparo", accent: "#b45309" },
  { id: "PRONTO", titulo: "Pronto", accent: "#16a34a" },
];

/** Which board column a card stage belongs to (ENVIADO waits in Recebido). */
function colunaDe(estagio: ItemPedidoStatus): Coluna {
  if (estagio === "ENVIADO" || estagio === "RECEBIDO") return "RECEBIDO";
  return estagio;
}

/** Ticks every 30s so elapsed-time labels stay honest. */
function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function KdsBoard({ estacao }: { estacao: Estacao }) {
  const pedidos = useAppStore((s) => s.pedidos);
  const garcons = useAppStore((s) => s.garcons);
  const receberPedido = useAppStore((s) => s.receberPedido);
  const avancarItemPedido = useAppStore((s) => s.avancarItemPedido);

  const agora = useNow();
  const [filtro, setFiltro] = useState<Coluna>("RECEBIDO");

  const fila = useMemo(() => kdsQueue(pedidos, estacao), [pedidos, estacao]);
  const gById = useMemo(() => garconsById(garcons), [garcons]);

  const porColuna = useMemo(() => {
    const map: Record<Coluna, typeof fila> = {
      RECEBIDO: [],
      EM_PREPARO: [],
      PRONTO: [],
    };
    for (const card of fila) map[colunaDe(card.estagio)].push(card);
    // Fresh dispatches first inside "Recebido".
    map.RECEBIDO.sort((a, b) =>
      a.estagio === b.estagio ? 0 : a.estagio === "ENVIADO" ? -1 : 1,
    );
    return map;
  }, [fila]);

  const renderColuna = (col: (typeof COLUNAS)[number]) => (
    <div key={col.id} className="flex min-h-0 flex-col rounded-[14px] bg-white/[0.04]">
      <div className="flex items-center justify-between px-3.5 py-3">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: col.accent }}
          />
          <strong className="text-[0.9rem] text-slate-100">{col.titulo}</strong>
        </div>
        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[0.78rem] font-bold text-slate-200">
          {porColuna[col.id].length}
        </span>
      </div>
      <div className="grid min-h-0 flex-1 content-start gap-2.5 overflow-y-auto px-2.5 pb-3">
        {porColuna[col.id].map(({ pedido, estagio }) => (
          <PedidoCard
            key={pedido.id}
            pedido={pedido}
            estacao={estacao}
            estagio={estagio}
            garcomNome={firstName(gById[pedido.garcomId]?.name ?? "—")}
            agora={agora}
            onReceber={() => receberPedido(pedido.id, estacao)}
            onAvancar={(itemId, para) => avancarItemPedido(pedido.id, itemId, para)}
          />
        ))}
        {porColuna[col.id].length === 0 && (
          <div className="rounded-[10px] border border-dashed border-white/10 px-3 py-6 text-center text-[0.82rem] text-slate-500">
            Nada aqui
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Narrow screens: column filter chips */}
      <div className="flex gap-1.5 px-4 pb-1 pt-3 md:hidden">
        {COLUNAS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFiltro(c.id)}
            className={`flex-1 rounded-[10px] px-3 py-2 text-[0.82rem] font-bold ${
              filtro === c.id ? "bg-white text-navy" : "bg-white/10 text-slate-300"
            }`}
          >
            {c.titulo} ({porColuna[c.id].length})
          </button>
        ))}
      </div>

      {/* Mobile: single filtered column */}
      <div className="flex min-h-0 flex-1 flex-col p-4 pt-2 md:hidden">
        {renderColuna(COLUNAS.find((c) => c.id === filtro)!)}
      </div>

      {/* md+: 3 columns side by side */}
      <div className="hidden min-h-0 flex-1 grid-cols-3 gap-3.5 p-4 md:grid lg:px-6">
        {COLUNAS.map(renderColuna)}
      </div>
    </div>
  );
}
