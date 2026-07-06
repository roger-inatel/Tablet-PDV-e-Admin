"use client";

import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import { itemPedidoStatusMeta } from "@/lib/domain/comanda";
import { fmt } from "@/lib/format";
import type { Pedido } from "@/types";

interface ComandaPedidosProps {
  pedidos: Pedido[];
}

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Dispatched pedidos, grouped by batch. Item status is OWNED by the KDS —
 * the waiter only observes it here (chips update live via realtime events).
 */
export function ComandaPedidos({ pedidos }: ComandaPedidosProps) {
  if (pedidos.length === 0) return null;

  return (
    <div className="grid gap-4">
      {pedidos.map((p) => (
        <div key={p.id}>
          <div className="mb-2.5 flex items-center gap-2.5">
            <span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-status-blue-bg text-status-blue-fg">
              <Icon name="printer" size={15} />
            </span>
            <strong className="text-[0.95rem] text-navy">Pedido #{p.seq}</strong>
            <span className="text-[0.78rem] text-[#94a3b8]">
              enviado às {hora(p.criadoEm)}
            </span>
          </div>
          <div className="grid gap-2">
            {p.itens.map((it) => {
              const meta = itemPedidoStatusMeta(it.status);
              return (
                <div
                  key={it.id}
                  className="flex items-center gap-3 rounded-[11px] border border-line bg-white px-[13px] py-[11px]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[0.94rem] font-bold text-navy">
                      {it.qtd > 1 ? `${it.qtd}× ${it.nome}` : it.nome}
                    </div>
                    <div className="mt-[3px] flex flex-wrap items-center gap-x-2 gap-y-1">
                      <StatusChip kind={meta.kind}>{meta.label}</StatusChip>
                      <span className="inline-flex items-center gap-1 text-[0.78rem] text-ink-muted">
                        <Icon
                          name={it.estacao === "cozinha" ? "flame" : "wine"}
                          size={12}
                        />
                        {it.estacao === "cozinha" ? "Cozinha" : "Bar"}
                      </span>
                      <span className="text-[0.8rem] text-ink-muted">
                        {fmt(it.precoUnit * it.qtd)}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 text-[1rem] font-extrabold text-navy">
                    {it.qtd}×
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
