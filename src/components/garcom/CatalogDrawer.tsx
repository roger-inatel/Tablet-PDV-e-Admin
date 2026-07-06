"use client";

import { CatalogPanel } from "./CatalogPanel";
import type { Category, Produto } from "@/types";

interface CatalogDrawerProps {
  categories: Category[];
  products: Produto[];
  activeCat: Category;
  onCat: (c: Category) => void;
  onAdd: (productId: string) => void;
  onClose: () => void;
}

/** Bottom sheet catalog used in "Foco" mode. */
export function CatalogDrawer({ onClose, ...catalog }: CatalogDrawerProps) {
  return (
    <>
      <div
        onClick={onClose}
        className="absolute inset-0 z-40 bg-[rgba(15,23,42,.4)] animate-[ovin_.18s_ease]"
      />
      <div className="absolute inset-x-0 bottom-0 z-[41] flex h-[80%] flex-col overflow-hidden rounded-t-[20px] bg-white shadow-[0_-20px_50px_-20px_rgba(15,23,42,.4)] animate-[popin_.22s_ease] md:h-[62%]">
        <CatalogPanel {...catalog} cols={2} onClose={onClose} />
      </div>
    </>
  );
}
