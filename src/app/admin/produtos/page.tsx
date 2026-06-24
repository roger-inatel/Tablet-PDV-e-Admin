"use client";

import { useMemo, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatusChip } from "@/components/ui/StatusChip";
import { Loader } from "@/components/ui/Loader";
import { useAppStore } from "@/store/useAppStore";
import { fmt } from "@/lib/format";
import type { Category } from "@/types";

export default function ProdutosPage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const products = useAppStore((s) => s.products);
  const categories = useAppStore((s) => s.categories);
  const [active, setActive] = useState<Category>("Entradas");

  const rows = useMemo(
    () => products.filter((p) => p.category === active),
    [products, active],
  );

  return (
    <>
      <AdminHeader kicker="Cadastros" title="Produtos" />
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-5 md:px-6 lg:px-8">
        {!hydrated ? (
          <Loader />
        ) : (
          <div className="grid gap-4 animate-[mfade_.22s_ease]">
            <div className="rounded-card border border-line bg-white px-5 py-4">
              <h2 className="m-0 mb-0.5 text-[1.08rem] text-navy">Cardápio</h2>
              <p className="m-0 mb-[13px] text-[0.88rem] text-ink-muted">
                Produtos vindos do banco local. A categorização define o setor de impressão
                de cada item.
              </p>
              <div className="flex flex-wrap gap-[7px]">
                {categories.map((c) => {
                  const on = c === active;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setActive(c)}
                      className={`rounded-[9px] border px-3.5 py-2 text-[0.86rem] font-bold ${
                        on
                          ? "border-[#93c5fd] bg-[#eff6ff] text-[#1e3a8a]"
                          : "border-[#d7e0ea] bg-white text-[#334155]"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile: cards */}
            <div className="grid gap-2.5 md:hidden">
              {rows.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-card border border-line bg-white px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[0.95rem] font-semibold text-navy">
                      {p.name}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <StatusChip kind={p.sector === "cozinha" ? "amber" : "blue"}>
                        {p.sector === "cozinha" ? "Cozinha 01" : "Bar 01"}
                      </StatusChip>
                      <span className="text-[0.78rem] text-ink-muted">{p.category}</span>
                    </div>
                  </div>
                  <strong className="shrink-0 text-[0.95rem] text-navy">
                    {fmt(p.price)}
                  </strong>
                </div>
              ))}
            </div>

            {/* Desktop/tablet: table */}
            <div className="hidden overflow-x-auto rounded-card border border-line bg-white p-1.5 md:block">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {["Produto", "Categoria", "Setor / impressora", "Preço"].map((h, i) => (
                      <th
                        key={h}
                        className={`border-b border-line bg-[#f8fafc] px-3.5 py-3 text-[0.78rem] font-bold text-[#334155] ${
                          i <= 1 ? "text-left" : i === 2 ? "text-center" : "text-right"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id} className="border-b border-[#eef1f6]">
                      <td className="px-3.5 py-3 text-[0.9rem] font-semibold text-navy">
                        {p.name}
                      </td>
                      <td className="px-3.5 py-3 text-[0.88rem] text-[#475569]">
                        {p.category}
                      </td>
                      <td className="px-3.5 py-3 text-center">
                        <StatusChip kind={p.sector === "cozinha" ? "amber" : "blue"}>
                          {p.sector === "cozinha" ? "Cozinha 01" : "Bar 01"}
                        </StatusChip>
                      </td>
                      <td className="px-3.5 py-3 text-right text-[0.9rem] font-bold text-navy">
                        {fmt(p.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
