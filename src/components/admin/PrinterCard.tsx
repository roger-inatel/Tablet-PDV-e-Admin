"use client";

import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import type { Printer } from "@/types";

interface PrinterCardProps {
  printer: Printer;
  onTest: () => void;
  onEdit: () => void;
}

const SECTOR_LABEL: Record<Printer["sector"], string> = {
  cozinha: "Setor: Cozinha",
  bar: "Setor: Bar",
  caixa: "Setor: Caixa",
};

const ICON_WRAP: Record<Printer["sector"], string> = {
  cozinha: "bg-status-amber-bg text-status-amber-fg",
  bar: "bg-status-blue-bg text-status-blue-fg",
  caixa: "bg-status-neutral-bg text-status-neutral-fg",
};

export function PrinterCard({ printer, onTest, onEdit }: PrinterCardProps) {
  const online = printer.status === "ONLINE";

  return (
    <div className="grid gap-3 rounded-card border border-line bg-white p-[18px]">
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <span
            className={`inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] ${ICON_WRAP[printer.sector]}`}
          >
            <Icon name="printer" size={18} />
          </span>
          <div>
            <strong className="block text-[1rem] text-navy">{printer.name}</strong>
            <span className="text-[0.8rem] text-ink-muted">
              {SECTOR_LABEL[printer.sector]}
            </span>
          </div>
        </div>
        <StatusChip kind={online ? "green" : "red"}>
          {online ? "Online" : "Offline"}
        </StatusChip>
      </div>

      <div className="grid gap-1.5 text-[0.84rem] text-[#475569]">
        <div className="flex justify-between">
          <span className="text-[#94a3b8]">Local</span>
          <span className="font-semibold text-[#334155]">{printer.location}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#94a3b8]">Modelo</span>
          <span className="font-semibold text-[#334155]">{printer.model}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onTest}
          className="flex-1 rounded-[9px] border border-[#dbe2ea] bg-[#f8fbff] py-2.5 text-[0.84rem] font-bold text-[#1f4e79]"
        >
          Testar impressão
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-[9px] border border-[#dbe2ea] bg-white px-3 py-2.5 text-[0.84rem] font-semibold text-[#334155]"
        >
          Editar
        </button>
      </div>
    </div>
  );
}
