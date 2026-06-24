"use client";

import { fmt } from "@/lib/format";
import type { Category, Product } from "@/types";

interface CatalogPanelProps {
  categories: Category[];
  products: Product[];
  activeCat: Category;
  onCat: (c: Category) => void;
  onAdd: (productId: string) => void;
  /** Product list columns (1 = side panel, 2 = drawer). */
  cols?: 1 | 2;
  /** When provided, shows a "Fechar" button (drawer mode). */
  onClose?: () => void;
}

export function CatalogPanel({
  categories,
  products,
  activeCat,
  onCat,
  onAdd,
  cols = 1,
  onClose,
}: CatalogPanelProps) {
  const filtered = products.filter((p) => p.category === activeCat);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#fbfcfe]">
      <div className="border-b border-line bg-white px-4 pb-2.5 pt-3.5 md:px-6">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="text-[1rem] font-extrabold text-navy">Catálogo</div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-[9px] border border-[#dbe2ea] bg-white px-3.5 py-2 text-[0.85rem] font-bold text-[#475569]"
            >
              Fechar
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => {
            const on = c === activeCat;
            return (
              <button
                key={c}
                type="button"
                onClick={() => onCat(c)}
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

      <div
        className="min-h-0 flex-1 overflow-y-auto px-4 py-3.5 md:px-6"
        style={{
          display: "grid",
          gap: 9,
          alignContent: "start",
          gridTemplateColumns:
            cols === 2 ? "repeat(auto-fill,minmax(150px,1fr))" : "1fr",
        }}
      >
        {filtered.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onAdd(p.id)}
            className="flex items-center justify-between gap-2.5 rounded-[11px] border border-line bg-white px-[15px] py-[13px] text-left"
          >
            <span className="grid min-w-0 gap-0.5">
              <strong className="text-[0.92rem] text-navy">{p.name}</strong>
              <span className="text-[0.8rem] text-ink-muted">{fmt(p.price)}</span>
            </span>
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#eff6ff] text-[1.3rem] font-bold text-[#1f4e79]">
              +
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
