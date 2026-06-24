"use client";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { PrinterCard } from "@/components/admin/PrinterCard";
import { Icon } from "@/components/ui/Icon";
import { Loader } from "@/components/ui/Loader";
import { repos } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";

const ROTEAMENTO = [
  {
    setor: "Refeições / Cozinha",
    desc: "Entradas, pratos e sobremesas",
    printer: "Cozinha 01",
    icon: "flame" as const,
    wrap: "bg-status-amber-bg text-status-amber-fg",
  },
  {
    setor: "Bebidas / Bar",
    desc: "Bebidas, drinks e cervejas",
    printer: "Bar 01",
    icon: "wine" as const,
    wrap: "bg-status-blue-bg text-status-blue-fg",
  },
];

export default function ImpressorasPage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const printers = useAppStore((s) => s.printers);
  const pushToast = useAppStore((s) => s.pushToast);

  const onTest = async (id: string, name: string) => {
    await repos.printers.test(id);
    pushToast(`Página de teste enviada para ${name}`);
  };

  return (
    <>
      <AdminHeader kicker="Sistema" title="Impressoras & setores" />
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-5 md:px-6 lg:px-8">
        {!hydrated ? (
          <Loader />
        ) : (
          <div className="grid gap-4 animate-[mfade_.22s_ease]">
            {/* Roteamento por setor */}
            <div className="rounded-card border border-line bg-white p-5">
              <h2 className="m-0 mb-0.5 text-[1.08rem] text-navy">Roteamento por setor</h2>
              <p className="m-0 mb-3.5 text-[0.88rem] text-ink-muted">
                Define para qual impressora cada tipo de item é enviado quando o garçom
                dispara o pedido.
              </p>
              <div className="grid gap-2.5">
                {ROTEAMENTO.map((r) => (
                  <div
                    key={r.setor}
                    className="flex flex-wrap items-center gap-3.5 rounded-[11px] border border-line bg-[#fbfcfe] px-[15px] py-[13px]"
                  >
                    <span
                      className={`inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] ${r.wrap}`}
                    >
                      <Icon name={r.icon} size={18} />
                    </span>
                    <div className="min-w-[160px] flex-1">
                      <strong className="block text-[0.94rem] text-navy">{r.setor}</strong>
                      <span className="text-[0.82rem] text-ink-muted">{r.desc}</span>
                    </div>
                    <span className="font-bold text-[#94a3b8]">→</span>
                    <span className="inline-flex items-center gap-1.5 rounded-[9px] border border-[#d5e2ef] bg-[#eff6ff] px-3 py-[7px] text-[0.85rem] font-bold text-[#1f4e79]">
                      {r.printer}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Impressoras instaladas */}
            <div>
              <h2 className="mb-3 mt-0.5 text-[1.08rem] text-navy">Impressoras instaladas</h2>
              <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
                {printers.map((p) => (
                  <PrinterCard
                    key={p.id}
                    printer={p}
                    onTest={() => onTest(p.id, p.name)}
                    onEdit={() => pushToast(`Editar ${p.name} (demonstração)`)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
