"use client";

import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import type { DraftItem, Station } from "@/types";

interface SendOrderModalProps {
  drafts: DraftItem[];
  sending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const STATION_META: Record<
  Station,
  { label: string; icon: "flame" | "wine"; wrap: string }
> = {
  kitchen: {
    label: "Cozinha",
    icon: "flame",
    wrap: "bg-status-amber-bg text-status-amber-fg",
  },
  bar: {
    label: "Bar",
    icon: "wine",
    wrap: "bg-status-blue-bg text-status-blue-fg",
  },
};

/**
 * Dispatch confirmation: previews the draft items grouped by station (the
 * backend routes each group to its KDS) before creating the order.
 */
export function SendOrderModal({
  drafts,
  sending,
  onClose,
  onConfirm,
}: SendOrderModalProps) {
  const groups = (["kitchen", "bar"] as Station[])
    .map((station) => ({
      station,
      items: drafts.filter((d) => d.station === station),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center gap-3.5 bg-gradient-to-br from-[#1f4e79] to-[#1e3a8a] px-[22px] py-[18px] text-white">
        <span className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-white/[0.18]">
          <Icon name="printer" size={20} />
        </span>
        <div>
          <div className="text-[1.1rem] font-extrabold">Enviar pedido</div>
          <div className="text-[0.84rem] opacity-85">
            Os itens serão roteados por estação
          </div>
        </div>
      </div>

      <div className="px-[22px] py-[18px]">
        <div className="grid max-h-[300px] gap-4 overflow-y-auto">
          {groups.map((g) => {
            const meta = STATION_META[g.station];
            return (
              <div key={g.station}>
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`inline-flex h-[26px] w-[26px] items-center justify-center rounded-[8px] ${meta.wrap}`}
                  >
                    <Icon name={meta.icon} size={14} />
                  </span>
                  <strong className="text-[0.88rem] text-navy">{meta.label}</strong>
                </div>
                <div className="grid gap-2">
                  {g.items.map((d) => (
                    <div
                      key={d.key}
                      className="flex items-center justify-between rounded-[10px] border border-[#eef1f6] bg-[#fbfcfe] px-3 py-2.5"
                    >
                      <span className="min-w-0 truncate text-[0.92rem] font-semibold text-navy">
                        {d.name}
                      </span>
                      <span className="shrink-0 font-extrabold text-[#1f4e79]">
                        {d.qty}×
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-[18px] flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-[11px] border border-[#dbe2ea] bg-white py-[13px] text-[0.92rem] font-bold text-[#334155]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={sending ? undefined : onConfirm}
            className={`flex-1 rounded-[11px] py-[13px] text-[0.92rem] font-extrabold text-white ${
              sending ? "cursor-wait bg-[#94a3b8]" : "bg-[#1f4e79]"
            }`}
          >
            {sending ? "Enviando…" : "Confirmar envio"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
