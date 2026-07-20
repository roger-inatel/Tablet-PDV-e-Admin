"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { PAYMENT_METHOD_LABEL } from "@/lib/domain/check";
import {
  computeChange,
  computeDiscount,
  computeServiceFee,
  settlementTotal,
  tendersPaid,
  validateSettlement,
} from "@/lib/domain/order";
import {
  canCancelCheckout,
  canRegisterPayment,
  canStartCheckout,
} from "@/lib/domain/permissions";
import { fmt, uid } from "@/lib/format";
import { useAppStore } from "@/store/useAppStore";
import type { AdjustmentKind, Check, PaymentMethod } from "@/types";

interface PaymentModalProps {
  /** Live check from the store — the modal reacts to realtime updates. */
  check: Check;
  /** Subtotal to charge (dispatched items only). */
  subtotal: number;
  onClose: () => void;
}

const METHODS: PaymentMethod[] = ["cash", "card", "pix"];

interface TenderRow {
  key: string;
  method: PaymentMethod;
  /** Raw text so the cashier can type "12,50". */
  amount: string;
}

/** Parse a pt-BR money string ("1.234,56" or "12.5") to a number. */
function parseAmount(s: string): number {
  const t = s.trim();
  if (!t) return 0;
  const normalized = t.includes(",")
    ? t.replace(/\./g, "").replace(",", ".")
    : t;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Cashier (manager-only) settlement builder: discount, service fee, split into
 * multiple tenders with change (troco). Confirming the payment closes the check
 * and frees the table.
 */
export function PaymentModal({ check, subtotal, onClose }: PaymentModalProps) {
  const session = useAppStore((s) => s.session);
  const startCheckout = useAppStore((s) => s.startCheckout);
  const cancelCheckout = useAppStore((s) => s.cancelCheckout);
  const registerPayment = useAppStore((s) => s.registerPayment);

  const [discountKind, setDiscountKind] = useState<AdjustmentKind>("value");
  const [discountInput, setDiscountInput] = useState("");
  const [feeKind, setFeeKind] = useState<AdjustmentKind>("percent");
  const [feeInput, setFeeInput] = useState("");
  const [tenders, setTenders] = useState<TenderRow[]>([
    { key: uid(), method: "card", amount: "" },
  ]);
  const [processing, setProcessing] = useState(false);

  const closed = check.status === "CLOSED";
  const awaitingPayment =
    check.status === "IN_CHECKOUT" && check.payment === null;

  const discount = useMemo(
    () => computeDiscount(subtotal, discountKind, parseAmount(discountInput)),
    [subtotal, discountKind, discountInput],
  );
  const serviceFee = useMemo(
    () => computeServiceFee(subtotal, feeKind, parseAmount(feeInput)),
    [subtotal, feeKind, feeInput],
  );
  const total = useMemo(
    () => settlementTotal(subtotal, discount, serviceFee),
    [subtotal, discount, serviceFee],
  );

  const tenderInputs = tenders.map((t) => ({
    method: t.method,
    amount: parseAmount(t.amount),
  }));
  const paid = tendersPaid(tenderInputs);
  const change = computeChange(total, tenderInputs);
  const validation = validateSettlement(total, tenderInputs);

  const setTender = (key: string, patch: Partial<TenderRow>) =>
    setTenders((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const addTender = () =>
    setTenders((rows) => {
      const remaining = Math.max(0, total - tendersPaid(
        rows.map((r) => ({ method: r.method, amount: parseAmount(r.amount) })),
      ));
      return [
        ...rows,
        { key: uid(), method: "cash", amount: remaining ? String(remaining.toFixed(2)).replace(".", ",") : "" },
      ];
    });

  const removeTender = (key: string) =>
    setTenders((rows) => (rows.length > 1 ? rows.filter((r) => r.key !== key) : rows));

  const fillRemaining = (key: string) =>
    setTenders((rows) => {
      const others = rows.filter((r) => r.key !== key);
      const remaining = Math.max(0, total - tendersPaid(
        others.map((r) => ({ method: r.method, amount: parseAmount(r.amount) })),
      ));
      return rows.map((r) =>
        r.key === key
          ? { ...r, amount: String(remaining.toFixed(2)).replace(".", ",") }
          : r,
      );
    });

  const confirm = async () => {
    setProcessing(true);
    await registerPayment(check.id, {
      discount,
      discountKind,
      discountInput: parseAmount(discountInput) || undefined,
      serviceFee,
      serviceFeeKind: feeKind,
      serviceFeeInput: parseAmount(feeInput) || undefined,
      tenders: tenderInputs,
    });
    setProcessing(false);
  };

  return (
    <Modal onClose={closed ? onClose : () => undefined}>
      <div
        className={`flex items-center gap-3.5 px-[22px] py-[18px] text-white ${
          closed
            ? "bg-gradient-to-br from-[#16a34a] to-[#166534]"
            : "bg-gradient-to-br from-[#1f4e79] to-[#1e3a8a]"
        }`}
      >
        <div>
          <div className="text-[1.1rem] font-extrabold">
            {closed ? "Comanda fechada" : `Pagamento · Mesa ${check.tableNum}`}
          </div>
          <div className="text-[0.84rem] opacity-85">
            {closed ? "Mesa liberada" : "Caixa · fechamento da comanda"}
          </div>
        </div>
      </div>

      <div className="grid max-h-[70vh] gap-3.5 overflow-y-auto px-[22px] py-[18px]">
        {/* Step 1 — start checkout (OPEN, cashier closes the tab) */}
        {check.status === "OPEN" && (
          <>
            <SummaryRow label="Total a cobrar" value={subtotal} />
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

        {/* Step 2 — settlement builder (IN_CHECKOUT, no payment) */}
        {awaitingPayment && (
          <>
            <SummaryRow label="Subtotal" value={subtotal} />

            <AdjustmentField
              label="Desconto"
              kind={discountKind}
              onKind={setDiscountKind}
              input={discountInput}
              onInput={setDiscountInput}
              resolved={discount}
              negative
            />
            <AdjustmentField
              label="Taxa de serviço"
              kind={feeKind}
              onKind={setFeeKind}
              input={feeInput}
              onInput={setFeeInput}
              resolved={serviceFee}
              quick={() => {
                setFeeKind("percent");
                setFeeInput("10");
              }}
              quickLabel="10%"
            />

            <div className="flex items-center justify-between rounded-[11px] border border-[#c7d2fe] bg-[#eef2ff] px-3.5 py-3">
              <span className="text-[0.9rem] font-bold text-[#3730a3]">
                Total a receber
              </span>
              <strong className="text-[1.35rem] text-[#312e81]">{fmt(total)}</strong>
            </div>

            {/* Tenders (split payment) */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[0.74rem] font-bold uppercase tracking-[0.05em] text-ink-muted">
                  Formas de pagamento
                </span>
                <button
                  type="button"
                  onClick={addTender}
                  className="rounded-[8px] border border-[#dbe2ea] bg-white px-2.5 py-1 text-[0.78rem] font-bold text-[#1f4e79]"
                >
                  + Adicionar forma
                </button>
              </div>
              {tenders.map((t) => (
                <div key={t.key} className="grid gap-1.5 rounded-[10px] border border-line bg-[#fbfcfe] p-2.5">
                  <div className="flex items-center gap-2">
                    <div className="grid flex-1 grid-cols-3 gap-1.5">
                      {METHODS.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setTender(t.key, { method: m })}
                          className={`rounded-[8px] border-2 py-1.5 text-[0.8rem] font-bold ${
                            t.method === m
                              ? "border-brand-600 bg-[#eff6ff] text-[#1e3a8a]"
                              : "border-line bg-white text-[#334155]"
                          }`}
                        >
                          {PAYMENT_METHOD_LABEL[m]}
                        </button>
                      ))}
                    </div>
                    {tenders.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTender(t.key)}
                        aria-label="Remover forma"
                        className="shrink-0 rounded-[8px] border border-[#fecaca] bg-white px-2.5 py-1.5 text-[0.9rem] font-bold text-[#dc2626]"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[0.82rem] font-semibold text-ink-muted">R$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={t.amount}
                      onChange={(e) => setTender(t.key, { amount: e.target.value })}
                      placeholder="0,00"
                      className="min-w-0 flex-1 rounded-[8px] border border-line bg-white px-2.5 py-2 text-[0.95rem] font-bold text-navy outline-none focus:border-brand-600"
                    />
                    <button
                      type="button"
                      onClick={() => fillRemaining(t.key)}
                      className="shrink-0 rounded-[8px] border border-[#dbe2ea] bg-white px-2.5 py-2 text-[0.78rem] font-bold text-[#334155]"
                    >
                      Restante
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-1 rounded-[11px] border border-[#eef1f6] bg-[#fbfcfe] px-3.5 py-2.5 text-[0.88rem]">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Recebido</span>
                <span className="font-bold text-navy">{fmt(paid)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Troco</span>
                <span className={`font-bold ${change > 0 ? "text-[#16a34a]" : "text-navy"}`}>
                  {fmt(change)}
                </span>
              </div>
            </div>

            {!validation.ok && (
              <p className="m-0 text-[0.82rem] font-semibold text-[#dc2626]">
                {validation.reason}
              </p>
            )}

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
                disabled={!canRegisterPayment(session, check) || !validation.ok || processing}
                onClick={confirm}
                className="flex-1 rounded-[11px] bg-[#16a34a] py-[13px] text-[0.92rem] font-extrabold text-white disabled:cursor-not-allowed disabled:bg-[#cbd5e1]"
              >
                {processing ? "Registrando…" : "Confirmar pagamento"}
              </button>
            </div>
          </>
        )}

        {/* Step 3 — success (payment closes the check and frees the table) */}
        {closed && (
          <>
            <div className="grid justify-items-center gap-1 py-1 text-center">
              <div className="text-[0.98rem] font-bold text-[#166534]">
                Pagamento concluído
              </div>
              <span className="text-[0.84rem] text-ink-muted">
                Comanda fechada · mesa liberada
              </span>
            </div>
            {check.settlement && (
              <div className="grid gap-1 rounded-[11px] border border-[#eef1f6] bg-[#fbfcfe] px-3.5 py-2.5 text-[0.86rem]">
                <SmallRow label="Subtotal" value={check.settlement.subtotal} />
                {check.settlement.discount > 0 && (
                  <SmallRow label="Desconto" value={-check.settlement.discount} />
                )}
                {check.settlement.serviceFee > 0 && (
                  <SmallRow label="Taxa de serviço" value={check.settlement.serviceFee} />
                )}
                <SmallRow label="Total" value={check.settlement.total} strong />
                {check.settlement.tenders.map((t) => (
                  <SmallRow
                    key={t.id}
                    label={PAYMENT_METHOD_LABEL[t.method]}
                    value={t.amount}
                    muted
                  />
                ))}
                {check.settlement.changeDue > 0 && (
                  <SmallRow label="Troco" value={check.settlement.changeDue} />
                )}
              </div>
            )}
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

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-[11px] border border-[#eef1f6] bg-[#fbfcfe] px-3.5 py-3">
      <span className="text-[0.9rem] font-semibold text-ink-muted">{label}</span>
      <strong className="text-[1.35rem] text-navy">{fmt(value)}</strong>
    </div>
  );
}

function SmallRow({
  label,
  value,
  strong,
  muted,
}: {
  label: string;
  value: number;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-ink-muted" : "text-[#334155]"}>{label}</span>
      <span className={`${strong ? "font-extrabold text-navy" : "font-semibold text-navy"}`}>
        {fmt(value)}
      </span>
    </div>
  );
}

function AdjustmentField({
  label,
  kind,
  onKind,
  input,
  onInput,
  resolved,
  negative,
  quick,
  quickLabel,
}: {
  label: string;
  kind: AdjustmentKind;
  onKind: (k: AdjustmentKind) => void;
  input: string;
  onInput: (v: string) => void;
  resolved: number;
  negative?: boolean;
  quick?: () => void;
  quickLabel?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[0.74rem] font-bold uppercase tracking-[0.05em] text-ink-muted">
          {label}
        </span>
        <span className="text-[0.82rem] font-bold text-navy">
          {resolved > 0 ? `${negative ? "− " : "+ "}${fmt(resolved)}` : "—"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => onKind("value")}
            className={`rounded-[8px] border-2 px-3 py-2 text-[0.8rem] font-bold ${
              kind === "value"
                ? "border-brand-600 bg-[#eff6ff] text-[#1e3a8a]"
                : "border-line bg-white text-[#334155]"
            }`}
          >
            R$
          </button>
          <button
            type="button"
            onClick={() => onKind("percent")}
            className={`rounded-[8px] border-2 px-3 py-2 text-[0.8rem] font-bold ${
              kind === "percent"
                ? "border-brand-600 bg-[#eff6ff] text-[#1e3a8a]"
                : "border-line bg-white text-[#334155]"
            }`}
          >
            %
          </button>
        </div>
        <input
          type="text"
          inputMode="decimal"
          value={input}
          onChange={(e) => onInput(e.target.value)}
          placeholder={kind === "percent" ? "0" : "0,00"}
          className="min-w-0 flex-1 rounded-[8px] border border-line bg-white px-2.5 py-2 text-[0.95rem] font-bold text-navy outline-none focus:border-brand-600"
        />
        {quick && (
          <button
            type="button"
            onClick={quick}
            className="shrink-0 rounded-[8px] border border-[#dbe2ea] bg-white px-2.5 py-2 text-[0.78rem] font-bold text-[#334155]"
          >
            {quickLabel}
          </button>
        )}
      </div>
    </div>
  );
}
