import type { ReactNode } from "react";
import type { ChipKind } from "@/types";

// Static class map so Tailwind's JIT can see every full class string.
const CHIP: Record<ChipKind, string> = {
  green: "bg-status-green-bg text-status-green-fg",
  amber: "bg-status-amber-bg text-status-amber-fg",
  red: "bg-status-red-bg text-status-red-fg",
  blue: "bg-status-blue-bg text-status-blue-fg",
  neutral: "bg-status-neutral-bg text-status-neutral-fg",
};

interface StatusChipProps {
  kind: ChipKind;
  children: ReactNode;
  className?: string;
}

export function StatusChip({ kind, children, className = "" }: StatusChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[0.76rem] font-bold ${CHIP[kind]} ${className}`}
    >
      {children}
    </span>
  );
}
