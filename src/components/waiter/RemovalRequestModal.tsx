"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { fmt } from "@/lib/format";

interface RemovalRequestModalProps {
  itemName: string;
  qty: number;
  amount: number;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

/**
 * Waiter requests removal of a dispatched item. It does NOT remove anything —
 * it creates a pending request for the manager to approve or reject.
 */
export function RemovalRequestModal({
  itemName,
  qty,
  amount,
  submitting,
  onClose,
  onConfirm,
}: RemovalRequestModalProps) {
  const [reason, setReason] = useState("");
  const canSubmit = reason.trim().length >= 3 && !submitting;

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center gap-3.5 bg-gradient-to-br from-[#b45309] to-[#92400e] px-[22px] py-[18px] text-white">
        <div>
          <div className="text-[1.1rem] font-extrabold">Solicitar remoção de item</div>
          <div className="text-[0.84rem] opacity-85">
            Requer autorização do gerente
          </div>
        </div>
      </div>

      <div className="grid gap-4 px-[22px] py-[18px]">
        <div className="flex items-center justify-between rounded-[11px] border border-[#eef1f6] bg-[#fbfcfe] px-3.5 py-3">
          <span className="min-w-0 truncate text-[0.95rem] font-bold text-navy">
            {qty > 1 ? `${qty}× ${itemName}` : itemName}
          </span>
          <strong className="shrink-0 text-[1.05rem] text-navy">{fmt(amount)}</strong>
        </div>

        <div className="grid gap-1.5">
          <label className="text-[0.74rem] font-bold uppercase tracking-[0.05em] text-ink-muted">
            Motivo da solicitação
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Ex.: cliente desistiu, item veio errado, duplicado…"
            className="w-full resize-none rounded-[10px] border border-line bg-white px-3 py-2.5 text-[0.92rem] text-navy outline-none focus:border-brand-600"
          />
        </div>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-[11px] border border-[#dbe2ea] bg-white py-[13px] text-[0.92rem] font-bold text-[#334155]"
          >
            Voltar
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => onConfirm(reason)}
            className="flex-1 rounded-[11px] bg-[#b45309] py-[13px] text-[0.92rem] font-extrabold text-white disabled:cursor-not-allowed disabled:bg-[#cbd5e1]"
          >
            {submitting ? "Enviando…" : "Enviar solicitação"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
