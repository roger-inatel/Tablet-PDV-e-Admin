"use client";

import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { useAppStore } from "@/store/useAppStore";

export function PrintModal() {
  const printModal = useAppStore((s) => s.printModal);
  const tables = useAppStore((s) => s.tables);
  const printers = useAppStore((s) => s.printers);
  const closeModal = useAppStore((s) => s.closeModal);
  const confirmSend = useAppStore((s) => s.confirmSend);

  if (!printModal) return null;

  const { tableId, sector } = printModal;
  const table = tables.find((t) => t.id === tableId);
  const items = (table?.items ?? []).filter(
    (it) => it.sector === sector && it.status === "PENDENTE",
  );
  const printer = printers.find((p) => p.sector === sector);
  const isCoz = sector === "cozinha";
  const headBg = isCoz
    ? "linear-gradient(135deg,#b45309,#92400e)"
    : "linear-gradient(135deg,#2563eb,#1e3a8a)";

  return (
    <Modal onClose={closeModal}>
      <div
        className="flex items-center gap-3.5 px-[22px] py-[18px] text-white"
        style={{ background: headBg }}
      >
        <span className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-white/[0.18]">
          <Icon name={isCoz ? "flame" : "wine"} size={20} />
        </span>
        <div>
          <div className="text-[1.1rem] font-extrabold">
            Enviar para {isCoz ? "Cozinha" : "Bar"}
          </div>
          <div className="text-[0.84rem] opacity-85">
            Impressora {printer?.name ?? ""}
          </div>
        </div>
      </div>

      <div className="px-[22px] py-[18px]">
        <div className="mb-2.5 text-[0.8rem] font-bold uppercase tracking-[0.06em] text-ink-muted">
          Itens deste envio
        </div>
        <div className="grid max-h-[240px] gap-2 overflow-y-auto">
          {items.map((it) => (
            <div
              key={it.key}
              className="flex items-center justify-between rounded-[10px] border border-[#eef1f6] bg-[#fbfcfe] px-3 py-2.5"
            >
              <span className="text-[0.92rem] font-semibold text-navy">{it.name}</span>
              <span className="font-extrabold text-[#1f4e79]">{it.qty}×</span>
            </div>
          ))}
        </div>

        <div className="mt-[18px] flex gap-2.5">
          <button
            type="button"
            onClick={closeModal}
            className="flex-1 rounded-[11px] border border-[#dbe2ea] bg-white py-[13px] text-[0.92rem] font-bold text-[#334155]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmSend}
            className="flex-1 rounded-[11px] bg-[#1f4e79] py-[13px] text-[0.92rem] font-extrabold text-white"
          >
            Confirmar e imprimir
          </button>
        </div>
      </div>
    </Modal>
  );
}
