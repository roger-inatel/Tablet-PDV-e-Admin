"use client";

import { useMemo, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { FechamentoModal } from "@/components/comanda/FechamentoModal";
import { Avatar } from "@/components/ui/Avatar";
import { StatusChip } from "@/components/ui/StatusChip";
import { Loader } from "@/components/ui/Loader";
import { useAppStore } from "@/store/useAppStore";
import { garconsById, pedidosDaComanda } from "@/store/selectors";
import {
  comandaStatusMeta,
  fiscalStatusMeta,
  METODO_LABEL,
} from "@/lib/domain/comanda";
import { totalCobrado, totalComanda } from "@/lib/domain/pedido";
import { fmt, firstName } from "@/lib/format";

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ComandasAdminPage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const comandas = useAppStore((s) => s.comandas);
  const pedidos = useAppStore((s) => s.pedidos);
  const garcons = useAppStore((s) => s.garcons);

  // Caixa flow: which comanda's fechamento modal is open.
  const [caixaId, setCaixaId] = useState<string | null>(null);
  const caixaComanda = caixaId ? comandas.find((c) => c.id === caixaId) : undefined;

  const rows = useMemo(() => {
    const gById = garconsById(garcons);
    const ordem = { EM_FECHAMENTO: 0, ABERTA: 1, FECHADA: 2 } as const;
    return [...comandas]
      .sort(
        (a, b) =>
          ordem[a.status] - ordem[b.status] ||
          new Date(b.abertaEm).getTime() - new Date(a.abertaEm).getTime(),
      )
      .map((c) => {
        const g = gById[c.garcomId];
        const meus = pedidosDaComanda(pedidos, c.id);
        return {
          comanda: c,
          garcom: g,
          total: totalComanda(c, meus),
          statusMeta: comandaStatusMeta(c.status),
          fiscalMeta: c.fiscal ? fiscalStatusMeta(c.fiscal.status) : null,
        };
      });
  }, [comandas, pedidos, garcons]);

  return (
    <>
      <AdminHeader kicker="Operação" title="Comandas & caixa" />
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-5 md:px-6 lg:px-8">
        {!hydrated ? (
          <Loader />
        ) : (
          <div className="grid gap-4 animate-[mfade_.22s_ease]">
            <div className="rounded-card border border-line bg-white px-5 py-4">
              <h2 className="m-0 mb-0.5 text-[1.08rem] text-navy">Todas as comandas</h2>
              <p className="m-0 text-[0.88rem] text-ink-muted">
                Acompanhe o ciclo de cada comanda — abertura, fechamento, pagamento e
                emissão fiscal.
              </p>
            </div>

            <div className="grid gap-2.5">
              {rows.map(({ comanda: c, garcom: g, total, statusMeta, fiscalMeta }) => (
                <div
                  key={c.id}
                  className="grid gap-2.5 rounded-card border border-line bg-white px-4 py-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <strong className="text-[1rem] text-navy">Mesa {c.mesaNum}</strong>
                      <StatusChip kind={statusMeta.kind}>{statusMeta.label}</StatusChip>
                      {fiscalMeta && (
                        <StatusChip kind={fiscalMeta.kind}>{fiscalMeta.label}</StatusChip>
                      )}
                    </div>
                    <strong className="text-[1.05rem] text-navy">{fmt(total)}</strong>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[0.84rem] text-ink-muted">
                    <span className="inline-flex items-center gap-2">
                      <Avatar
                        initials={g?.initials ?? "--"}
                        color={g?.color ?? "#94a3b8"}
                        size={22}
                      />
                      {g ? firstName(g.name) : "—"} · aberta às {hora(c.abertaEm)}
                      {c.fechadaEm ? ` · fechada às ${hora(c.fechadaEm)}` : ""}
                    </span>
                    <span>
                      {c.pagamento
                        ? `Pagamento: ${METODO_LABEL[c.pagamento.metodo]}`
                        : "Sem pagamento"}
                      {c.fiscal?.erroMsg ? ` · ${c.fiscal.erroMsg}` : ""}
                    </span>
                  </div>

                  {/* Caixa actions */}
                  {c.status !== "FECHADA" && (
                    <div className="flex flex-wrap gap-2">
                      {c.status === "ABERTA" && (
                        <button
                          type="button"
                          disabled={c.itensDraft.length > 0}
                          title={
                            c.itensDraft.length > 0
                              ? "Há itens não enviados na comanda"
                              : undefined
                          }
                          onClick={() => setCaixaId(c.id)}
                          className="rounded-[9px] border border-[#dbe2ea] bg-white px-3.5 py-2 text-[0.84rem] font-bold text-[#334155] disabled:cursor-not-allowed disabled:text-[#94a3b8]"
                        >
                          Fechar conta
                        </button>
                      )}
                      {c.status === "EM_FECHAMENTO" && !c.pagamento && (
                        <button
                          type="button"
                          onClick={() => setCaixaId(c.id)}
                          className="rounded-[9px] bg-[#16a34a] px-3.5 py-2 text-[0.84rem] font-bold text-white"
                        >
                          Registrar pagamento
                        </button>
                      )}
                      {c.fiscal?.status === "ERRO" && (
                        <button
                          type="button"
                          onClick={() => setCaixaId(c.id)}
                          className="rounded-[9px] bg-[#dc2626] px-3.5 py-2 text-[0.84rem] font-bold text-white"
                        >
                          Resolver erro fiscal
                        </button>
                      )}
                      {c.fiscal?.status === "PROCESSANDO" && (
                        <button
                          type="button"
                          onClick={() => setCaixaId(c.id)}
                          className="rounded-[9px] border border-[#dbe2ea] bg-white px-3.5 py-2 text-[0.84rem] font-bold text-[#334155]"
                        >
                          Acompanhar emissão
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {caixaComanda && (
        <FechamentoModal
          comanda={caixaComanda}
          total={totalCobrado(pedidosDaComanda(pedidos, caixaComanda.id))}
          onClose={() => setCaixaId(null)}
        />
      )}
    </>
  );
}
