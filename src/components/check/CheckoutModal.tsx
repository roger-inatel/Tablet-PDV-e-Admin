"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { StatusChip } from "@/components/ui/StatusChip";
import { PAYMENT_METHOD_LABEL } from "@/lib/domain/check";
import {
  canCancelCheckout,
  canRegisterPayment,
  canRetryFiscal,
  canStartCheckout,
} from "@/lib/domain/permissions";
import { fmt } from "@/lib/format";
import { useAppStore } from "@/store/useAppStore";
import type { Check, PaymentMethod } from "@/types";

interface CheckoutModalProps {
  /** Live check from the store — the modal reacts to realtime updates. */
  check: Check;
  /** Charged total (dispatched items only). */
  total: number;
  onClose: () => void;
}

const METHODS: PaymentMethod[] = ["cash", "card", "pix"];

/**
 * Async checkout flow: start checkout -> register payment -> fiscal
 * PROCESSING (spinner) -> ISSUED (check closed, table freed) | ERROR
 * (retry by the cashier). State-driven: every step reflects the live check.
 */
export function CheckoutModal({ check, total, onClose }: CheckoutModalProps) {
  const session = useAppStore((s) => s.session);
  const startCheckout = useAppStore((s) => s.startCheckout);
  const cancelCheckout = useAppStore((s) => s.cancelCheckout);
  const registerPayment = useAppStore((s) => s.registerPayment);
  const retryFiscal = useAppStore((s) => s.retryFiscal);

  const [method, setMethod] = useState<PaymentMethod>("card");
  const [simulateError, setSimulateError] = useState(false);
  const [processing, setProcessing] = useState(false);

  const fiscal = check.fiscal;
  const closed = check.status === "CLOSED";
  const awaitingPayment =
    check.status === "IN_CHECKOUT" && check.payment === null;
  const issuing = fiscal?.status === "PROCESSING";
  const fiscalError = fiscal?.status === "ERROR";

  const confirm = async () => {
    setProcessing(true);
    await registerPayment(check.id, method, simulateError);
    setProcessing(false);
  };

  return (
    <Modal onClose={closed ? onClose : () => undefined}>
      <div
        className={`flex items-center gap-3.5 px-[22px] py-[18px] text-white ${
          closed
            ? "bg-gradient-to-br from-[#16a34a] to-[#166534]"
            : fiscalError
              ? "bg-gradient-to-br from-[#dc2626] to-[#991b1b]"
              : "bg-gradient-to-br from-[#1f4e79] to-[#1e3a8a]"
        }`}
      >
        <div>
          <div className="text-[1.1rem] font-extrabold">
            {closed
              ? "Comanda fechada"
              : fiscalError
                ? "Falha na emissão fiscal"
                : `Fechar conta · Mesa ${check.tableNum}`}
          </div>
          <div className="text-[0.84rem] opacity-85">
            {closed
              ? "Mesa liberada"
              : fiscalError
                ? fiscal?.errorMsg
                : "Fechamento com emissão de NFC-e"}
          </div>
        </div>
      </div>

      <div className="grid gap-4 px-[22px] py-[18px]">
        <div className="flex items-center justify-between rounded-[11px] border border-[#eef1f6] bg-[#fbfcfe] px-3.5 py-3">
          <span className="text-[0.9rem] font-semibold text-ink-muted">
            Total a cobrar
          </span>
          <strong className="text-[1.35rem] text-navy">{fmt(total)}</strong>
        </div>

        {/* Step 1 — confirm checkout (OPEN) */}
        {check.status === "OPEN" && (
          <>
            <p className="m-0 text-[0.88rem] text-ink-muted">
              Ao iniciar o fechamento, a comanda fica travada para novos itens até
              o pagamento ser concluído (ou o fechamento cancelado).
            </p>
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
                disabled={!canStartCheckout(session, check)}
                onClick={() => startCheckout(check.id)}
                className="flex-1 rounded-[11px] bg-[#1f4e79] py-[13px] text-[0.92rem] font-extrabold text-white disabled:cursor-not-allowed disabled:bg-[#cbd5e1]"
              >
                Iniciar fechamento
              </button>
            </div>
          </>
        )}

        {/* Step 2 — payment (IN_CHECKOUT, no payment yet) */}
        {awaitingPayment && (
          <>
            <div className="grid gap-1.5">
              <span className="text-[0.74rem] font-bold uppercase tracking-[0.05em] text-ink-muted">
                Método de pagamento
              </span>
              <div className="grid grid-cols-3 gap-2">
                {METHODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={`rounded-[10px] border-2 py-2.5 text-[0.88rem] font-bold ${
                      method === m
                        ? "border-brand-600 bg-[#eff6ff] text-[#1e3a8a]"
                        : "border-line bg-white text-[#334155]"
                    }`}
                  >
                    {PAYMENT_METHOD_LABEL[m]}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-[0.82rem] text-ink-muted">
              <input
                type="checkbox"
                checked={simulateError}
                onChange={(e) => setSimulateError(e.target.checked)}
                className="h-4 w-4"
              />
              Simular falha fiscal (demonstração)
            </label>

            <div className="flex gap-2.5">
              {canCancelCheckout(session, check) && (
                <button
                  type="button"
                  onClick={async () => {
                    await cancelCheckout(check.id);
                    onClose();
                  }}
                  className="flex-1 rounded-[11px] border border-[#dbe2ea] bg-white py-[13px] text-[0.92rem] font-bold text-[#334155]"
                >
                  Cancelar fechamento
                </button>
              )}
              <button
                type="button"
                disabled={!canRegisterPayment(session, check) || processing}
                onClick={confirm}
                className="flex-1 rounded-[11px] bg-[#16a34a] py-[13px] text-[0.92rem] font-extrabold text-white disabled:cursor-not-allowed disabled:bg-[#cbd5e1]"
              >
                {processing ? "Registrando…" : "Confirmar pagamento"}
              </button>
            </div>
          </>
        )}

        {/* Step 3 — async fiscal issuance */}
        {issuing && (
          <div className="grid justify-items-center gap-3 py-4 text-center">
            <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#1f4e79] border-t-transparent" />
            <div>
              <div className="text-[0.95rem] font-bold text-navy">
                Emitindo NFC-e…
              </div>
              <div className="text-[0.82rem] text-ink-muted">
                Pagamento em {PAYMENT_METHOD_LABEL[check.payment!.method]}{" "}
                registrado. A confirmação chega em instantes.
              </div>
            </div>
          </div>
        )}

        {/* Step 3b — fiscal error */}
        {fiscalError && (
          <>
            <div className="rounded-[11px] border border-[#fecaca] bg-[#fef2f2] px-3.5 py-3 text-[0.86rem] text-[#991b1b]">
              <strong>{fiscal?.errorMsg}</strong>
              <div className="mt-1 text-[0.8rem]">
                Tentativas: {fiscal?.attempts}. O pagamento foi registrado; a
                nota pode ser reemitida sem cobrar novamente.
              </div>
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-[11px] border border-[#dbe2ea] bg-white py-[13px] text-[0.92rem] font-bold text-[#334155]"
              >
                Fechar
              </button>
              {canRetryFiscal(session, check) ? (
                <button
                  type="button"
                  onClick={() => retryFiscal(check.id)}
                  className="flex-1 rounded-[11px] bg-[#dc2626] py-[13px] text-[0.92rem] font-extrabold text-white"
                >
                  Reemitir NFC-e
                </button>
              ) : (
                <div className="flex flex-1 items-center justify-center rounded-[11px] bg-[#f1f5f9] px-3 text-center text-[0.8rem] font-semibold text-ink-muted">
                  Reemissão pelo caixa/gerência
                </div>
              )}
            </div>
          </>
        )}

        {/* Step 4 — success */}
        {closed && (
          <>
            <div className="grid justify-items-center gap-2 py-2 text-center">
              <StatusChip kind="green">NFC-e emitida</StatusChip>
              {check.fiscal?.accessKey && (
                <span className="text-[0.78rem] text-ink-muted">
                  {check.fiscal.accessKey}
                </span>
              )}
              <span className="text-[0.88rem] text-ink-muted">
                Pagamento em{" "}
                {check.payment ? PAYMENT_METHOD_LABEL[check.payment.method] : "—"} ·
                mesa liberada.
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-[11px] bg-[#16a34a] py-[13px] text-[0.92rem] font-extrabold text-white"
            >
              Concluir
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
