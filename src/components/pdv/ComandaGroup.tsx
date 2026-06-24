"use client";

import { Icon, type IconName } from "@/components/ui/Icon";
import { ComandaItem } from "./ComandaItem";
import type { ComandaItem as ComandaItemType, Sector } from "@/types";

interface ComandaGroupProps {
  sector: Sector;
  items: ComandaItemType[];
  onInc: (key: string) => void;
  onDec: (key: string) => void;
  onAdvance: (key: string) => void;
}

const META: Record<
  Sector,
  { label: string; icon: IconName; wrap: string; note: string }
> = {
  cozinha: {
    label: "Cozinha",
    icon: "flame",
    wrap: "bg-status-amber-bg text-status-amber-fg",
    note: "→ Cozinha 01",
  },
  bar: {
    label: "Bar",
    icon: "wine",
    wrap: "bg-status-blue-bg text-status-blue-fg",
    note: "→ Bar 01",
  },
};

export function ComandaGroup({
  sector,
  items,
  onInc,
  onDec,
  onAdvance,
}: ComandaGroupProps) {
  if (items.length === 0) return null;
  const meta = META[sector];

  return (
    <div>
      <div className="mb-2.5 flex items-center gap-2.5">
        <span
          className={`inline-flex h-[30px] w-[30px] items-center justify-center rounded-[9px] ${meta.wrap}`}
        >
          <Icon name={meta.icon} size={16} />
        </span>
        <strong className="text-[0.95rem] text-navy">{meta.label}</strong>
        <span className="text-[0.78rem] text-[#94a3b8]">{meta.note}</span>
      </div>
      <div className="grid gap-2">
        {items.map((it) => (
          <ComandaItem
            key={it.key}
            item={it}
            onInc={() => onInc(it.key)}
            onDec={() => onDec(it.key)}
            onAdvance={() => onAdvance(it.key)}
          />
        ))}
      </div>
    </div>
  );
}
