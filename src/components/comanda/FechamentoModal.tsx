"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { StatusChip } from "@/components/ui/StatusChip";
import { METODO_LABEL } from "@/lib/domain/comanda";
import {
  podeCancelarFechamento,
  podeIniciarFechamento,
  podeRegistrarPagamento,
  podeRetryFiscal,
} from "@/lib/domain/permissions";
import { fmt } from "@/lib/format";
import { useAppStore } from "@/store/useAppStore";
import type { Comanda, MetodoPagamento } from "@/types";

interface FechamentoModalProps {
  /** Live comanda from the store — the modal reacts to realtime updates. */
  comanda: Comanda;
  /** Charged total (dispatched items only). */
  total: number;
  onClose: () => void;
}

const METODOS: MetodoPagamento[] = ["dinheiro", "cartao", "pix"];

/**
 * Async closing flow: iniciar fechamento -> registrar pagamento -> fiscal
 * PROCESSANDO (spinner) -> EMITIDA (comanda fechada, mesa livre) | ERRO
 * (retry pelo caixa). State-driven: every step reflects the live comanda.
 */
export function FechamentoModal({ comanda, total, onClose }: FechamentoModalProps) {
  const sessao = useAppStore((s) => s.sessao);
  const iniciarFechamento = useAppStore((s) => s.iniciarFechamento);
  const cancelarFechamento = useAppStore((s) => s.cancelarFechamento);
  const registrarPagamento = useAppStore((s) => s.registrarPagamento);
  const retryFiscal = useAppStore((s) => s.retryFiscal);

  const [metodo, setMetodo] = useState<MetodoPagamento>("cartao");
  const [simularErro, setSimularErro] = useState(false);
  const [processando, setProcessando] = useState(false);

  const fiscal = comanda.fiscal;
  const fechada = comanda.status === "FECHADA";
  const aguardandoPagamento =
    comanda.status === "EM_FECHAMENTO" && comanda.pagamento === null;
  const emitindo = fiscal?.status === "PROCESSANDO";
  const erroFiscal = fiscal?.status === "ERRO";

  const confirmar = async () => {
    setProcessando(true);
    await registrarPagamento(comanda.id, metodo, simularErro);
    setProcessando(false);
  };

  return (
    <Modal onClose={fechada ? onClose : () => undefined}>
      <div
        className={`flex items-center gap-3.5 px-[22px] py-[18px] text-white ${
          fechada
            ? "bg-gradient-to-br from-[#16a34a] to-[#166534]"
            : erroFiscal
              ? "bg-gradient-to-br from-[#dc2626] to-[#991b1b]"
              : "bg-gradient-to-br from-[#1f4e79] to-[#1e3a8a]"
        }`}
      >
        <div>
          <div className="text-[1.1rem] font-extrabold">
            {fechada
              ? "Comanda fechada"
              : erroFiscal
                ? "Falha na emissão fiscal"
                : `Fechar conta · Mesa ${comanda.mesaNum}`}
          </div>
          <div className="text-[0.84rem] opacity-85">
            {fechada
              ? "Mesa liberada"
              : erroFiscal
                ? fiscal?.erroMsg
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

        {/* Step 1 — confirm closing (ABERTA) */}
        {comanda.status === "ABERTA" && (
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
                disabled={!podeIniciarFechamento(sessao, comanda)}
                onClick={() => iniciarFechamento(comanda.id)}
                className="flex-1 rounded-[11px] bg-[#1f4e79] py-[13px] text-[0.92rem] font-extrabold text-white disabled:cursor-not-allowed disabled:bg-[#cbd5e1]"
              >
                Iniciar fechamento
              </button>
            </div>
          </>
        )}

        {/* Step 2 — payment (EM_FECHAMENTO, no payment yet) */}
        {aguardandoPagamento && (
          <>
            <div className="grid gap-1.5">
              <span className="text-[0.74rem] font-bold uppercase tracking-[0.05em] text-ink-muted">
                Método de pagamento
              </span>
              <div className="grid grid-cols-3 gap-2">
                {METODOS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMetodo(m)}
                    className={`rounded-[10px] border-2 py-2.5 text-[0.88rem] font-bold ${
                      metodo === m
                        ? "border-brand-600 bg-[#eff6ff] text-[#1e3a8a]"
                        : "border-line bg-white text-[#334155]"
                    }`}
                  >
                    {METODO_LABEL[m]}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-[0.82rem] text-ink-muted">
              <input
                type="checkbox"
                checked={simularErro}
                onChange={(e) => setSimularErro(e.target.checked)}
                className="h-4 w-4"
              />
              Simular falha fiscal (demonstração)
            </label>

            <div className="flex gap-2.5">
              {podeCancelarFechamento(sessao, comanda) && (
                <button
                  type="button"
                  onClick={async () => {
                    await cancelarFechamento(comanda.id);
                    onClose();
                  }}
                  className="flex-1 rounded-[11px] border border-[#dbe2ea] bg-white py-[13px] text-[0.92rem] font-bold text-[#334155]"
                >
                  Cancelar fechamento
                </button>
              )}
              <button
                type="button"
                disabled={!podeRegistrarPagamento(sessao, comanda) || processando}
                onClick={confirmar}
                className="flex-1 rounded-[11px] bg-[#16a34a] py-[13px] text-[0.92rem] font-extrabold text-white disabled:cursor-not-allowed disabled:bg-[#cbd5e1]"
              >
                {processando ? "Registrando…" : "Confirmar pagamento"}
              </button>
            </div>
          </>
        )}

        {/* Step 3 — async fiscal emission */}
        {emitindo && (
          <div className="grid justify-items-center gap-3 py-4 text-center">
            <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#1f4e79] border-t-transparent" />
            <div>
              <div className="text-[0.95rem] font-bold text-navy">
                Emitindo NFC-e…
              </div>
              <div className="text-[0.82rem] text-ink-muted">
                Pagamento em {METODO_LABEL[comanda.pagamento!.metodo]} registrado.
                A confirmação chega em instantes.
              </div>
            </div>
          </div>
        )}

        {/* Step 3b — fiscal error */}
        {erroFiscal && (
          <>
            <div className="rounded-[11px] border border-[#fecaca] bg-[#fef2f2] px-3.5 py-3 text-[0.86rem] text-[#991b1b]">
              <strong>{fiscal?.erroMsg}</strong>
              <div className="mt-1 text-[0.8rem]">
                Tentativas: {fiscal?.tentativas}. O pagamento foi registrado; a
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
              {podeRetryFiscal(sessao, comanda) ? (
                <button
                  type="button"
                  onClick={() => retryFiscal(comanda.id)}
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
        {fechada && (
          <>
            <div className="grid justify-items-center gap-2 py-2 text-center">
              <StatusChip kind="green">NFC-e emitida</StatusChip>
              {comanda.fiscal?.chave && (
                <span className="text-[0.78rem] text-ink-muted">
                  {comanda.fiscal.chave}
                </span>
              )}
              <span className="text-[0.88rem] text-ink-muted">
                Pagamento em{" "}
                {comanda.pagamento ? METODO_LABEL[comanda.pagamento.metodo] : "—"} ·
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
