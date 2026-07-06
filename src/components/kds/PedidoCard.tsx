"use client";

import { StatusChip } from "@/components/ui/StatusChip";
import { itemPedidoStatusMeta } from "@/lib/domain/comanda";
import { itensDaEstacao } from "@/lib/domain/pedido";
import type { Estacao, ItemPedidoStatus, Pedido } from "@/types";

interface PedidoCardProps {
  pedido: Pedido;
  estacao: Estacao;
  /** Card stage for this station (drives the highlight + bulk button). */
  estagio: ItemPedidoStatus;
  garcomNome: string;
  agora: number;
  onReceber: () => void;
  onAvancar: (itemId: string, para: ItemPedidoStatus) => void;
}

function minutosDesde(iso: string, agora: number): number {
  return Math.max(0, Math.round((agora - new Date(iso).getTime()) / 60_000));
}

export function PedidoCard({
  pedido,
  estacao,
  estagio,
  garcomNome,
  agora,
  onReceber,
  onAvancar,
}: PedidoCardProps) {
  const itens = itensDaEstacao(pedido, estacao);
  const novo = estagio === "ENVIADO";
  const minutos = minutosDesde(pedido.criadoEm, agora);

  return (
    <div
      className={`grid gap-2.5 rounded-[14px] border bg-white p-3.5 ${
        novo ? "border-[#f59e0b] shadow-[0_0_0_2px_rgba(245,158,11,.35)]" : "border-line"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <strong className="text-[1.15rem] leading-none text-navy">
              Mesa {pedido.mesaNum}
            </strong>
            {novo && <StatusChip kind="amber">NOVO</StatusChip>}
          </div>
          <div className="mt-1 text-[0.76rem] text-ink-muted">
            Pedido #{pedido.seq} · {garcomNome}
          </div>
        </div>
        <span
          className={`shrink-0 text-[0.82rem] font-bold ${
            minutos >= 15 ? "text-[#dc2626]" : "text-ink-muted"
          }`}
        >
          há {minutos} min
        </span>
      </div>

      <div className="grid gap-1.5">
        {itens.map((it) => {
          const meta = itemPedidoStatusMeta(it.status);
          return (
            <div
              key={it.id}
              className="flex items-center gap-2.5 rounded-[10px] border border-[#eef1f6] bg-[#fbfcfe] px-2.5 py-2"
            >
              <span className="w-8 shrink-0 text-center text-[0.95rem] font-extrabold text-navy">
                {it.qtd}×
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[0.9rem] font-semibold text-navy">
                  {it.nome}
                </div>
                <StatusChip kind={meta.kind}>{meta.label}</StatusChip>
              </div>
              {it.status === "RECEBIDO" && (
                <button
                  type="button"
                  onClick={() => onAvancar(it.id, "EM_PREPARO")}
                  className="shrink-0 rounded-[9px] bg-[#b45309] px-3 py-2 text-[0.8rem] font-bold text-white"
                >
                  Iniciar
                </button>
              )}
              {it.status === "EM_PREPARO" && (
                <button
                  type="button"
                  onClick={() => onAvancar(it.id, "PRONTO")}
                  className="shrink-0 rounded-[9px] bg-[#16a34a] px-3 py-2 text-[0.8rem] font-bold text-white"
                >
                  Pronto
                </button>
              )}
            </div>
          );
        })}
      </div>

      {novo && (
        <button
          type="button"
          onClick={onReceber}
          className="rounded-[10px] bg-[#1f4e79] py-2.5 text-[0.9rem] font-extrabold text-white"
        >
          Receber pedido
        </button>
      )}
    </div>
  );
}
