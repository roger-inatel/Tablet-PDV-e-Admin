"use client";

import { fmt } from "@/lib/format";

interface CheckFooterProps {
  total: number;
  /** Qty of draft items pending dispatch. */
  toSend: number;
  onSend: () => void;
  onCheckout: () => void;
}

export function CheckFooter({
  total,
  toSend,
  onSend,
  onCheckout,
}: CheckFooterProps) {
  const canSend = toSend > 0;
  const canCheckout = toSend === 0;

  return (
    <div className="pos-chrome grid gap-2.5 border-t border-line bg-white px-4 py-3 md:px-6 md:py-3.5 lg:px-8">
      <div className="flex items-center justify-between">
        <span className="text-[0.92rem] font-semibold text-ink-muted">
          Total da comanda
        </span>
        <strong className="text-[1.35rem] text-navy md:text-[1.5rem]">
          {fmt(total)}
        </strong>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={canSend ? onSend : undefined}
          className={`flex items-center justify-center gap-2 rounded-[11px] px-3 py-[13px] text-[0.9rem] font-extrabold md:text-[0.92rem] ${
            canSend
              ? "bg-[#1f4e79] text-white"
              : "cursor-not-allowed bg-[#e2e8f0] text-[#94a3b8]"
          }`}
        >
          <span className="truncate">
            Enviar pedido {canSend ? `(${toSend})` : ""}
          </span>
        </button>
        <button
          type="button"
          onClick={canCheckout ? onCheckout : undefined}
          title={
            canCheckout ? undefined : "Envie ou remova os itens pendentes antes"
          }
          className={`rounded-[11px] border px-3 py-[13px] text-[0.92rem] font-bold ${
            canCheckout
              ? "border-[#dbe2ea] bg-white text-[#334155]"
              : "cursor-not-allowed border-[#e2e8f0] bg-[#f1f5f9] text-[#94a3b8]"
          }`}
        >
          Fechar conta
        </button>
      </div>
    </div>
  );
}
