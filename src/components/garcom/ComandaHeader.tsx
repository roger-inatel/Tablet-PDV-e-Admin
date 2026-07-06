"use client";

import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { itemPedidoStatusMeta } from "@/lib/domain/comanda";
import type { ChipKind, ComandaVariant, ItemPedidoStatus } from "@/types";

interface ComandaHeaderProps {
  mesaNum: number;
  seats: number;
  garcomNome: string;
  /** Read-only consulta of another waiter's comanda. */
  readOnly: boolean;
  contagens: { aEnviar: number; porStatus: Record<ItemPedidoStatus, number> };
  variant: ComandaVariant;
  onVariant: (v: ComandaVariant) => void;
  onBack: () => void;
  showToggle: boolean;
}

export function ComandaHeader({
  mesaNum,
  seats,
  garcomNome,
  readOnly,
  contagens,
  variant,
  onVariant,
  onBack,
  showToggle,
}: ComandaHeaderProps) {
  const chips: { kind: ChipKind; label: string; count: number }[] = [];
  if (contagens.aEnviar > 0) {
    chips.push({ kind: "neutral", label: "a enviar", count: contagens.aEnviar });
  }
  (Object.keys(contagens.porStatus) as ItemPedidoStatus[]).forEach((st) => {
    const count = contagens.porStatus[st];
    if (count > 0) {
      const meta = itemPedidoStatusMeta(st);
      chips.push({ kind: meta.kind, label: meta.label.toLowerCase(), count });
    }
  });

  return (
    <div className="pdv-chrome flex flex-col gap-2.5 border-b border-line bg-white px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6 md:py-3.5 lg:px-8">
      <div className="flex items-center gap-3 md:gap-3.5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-[10px] border border-[#dbe2ea] bg-white px-3 py-2.5 text-[0.86rem] font-bold text-[#475569]"
        >
          <Icon name="back" size={16} /> Mesas
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-[1.2rem] font-extrabold text-navy">
              Mesa {mesaNum}
            </div>
            {readOnly && (
              <StatusChip kind="neutral">
                <Icon name="lock" size={11} strokeWidth={2.4} />
                somente leitura
              </StatusChip>
            )}
          </div>
          <div className="truncate text-[0.82rem] text-ink-muted">
            {seats} lugares · {readOnly ? `Comanda de ${garcomNome}` : garcomNome}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        {chips.map((c) => (
          <StatusChip key={c.label} kind={c.kind}>
            {c.count} {c.label}
          </StatusChip>
        ))}
        {showToggle && !readOnly && (
          <SegmentedToggle<ComandaVariant>
            value={variant}
            onChange={onVariant}
            options={[
              { value: "dividido", label: "Dividido" },
              { value: "foco", label: "Foco" },
            ]}
          />
        )}
      </div>
    </div>
  );
}
