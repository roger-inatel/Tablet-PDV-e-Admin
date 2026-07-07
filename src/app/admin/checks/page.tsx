"use client";

import { useMemo, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { CheckoutModal } from "@/components/check/CheckoutModal";
import { Avatar } from "@/components/ui/Avatar";
import { StatusChip } from "@/components/ui/StatusChip";
import { Loader } from "@/components/ui/Loader";
import { useAppStore } from "@/store/useAppStore";
import { ordersOfCheck, waitersById } from "@/store/selectors";
import {
  checkStatusMeta,
  fiscalStatusMeta,
  PAYMENT_METHOD_LABEL,
} from "@/lib/domain/check";
import { chargedTotal, checkTotal } from "@/lib/domain/order";
import { fmt, firstName } from "@/lib/format";

function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminChecksPage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const checks = useAppStore((s) => s.checks);
  const orders = useAppStore((s) => s.orders);
  const waiters = useAppStore((s) => s.waiters);

  // Cashier flow: which check's checkout modal is open.
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const checkoutCheck = checkoutId
    ? checks.find((c) => c.id === checkoutId)
    : undefined;

  const rows = useMemo(() => {
    const byId = waitersById(waiters);
    const order = { IN_CHECKOUT: 0, OPEN: 1, CLOSED: 2 } as const;
    return [...checks]
      .sort(
        (a, b) =>
          order[a.status] - order[b.status] ||
          new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime(),
      )
      .map((c) => {
        const w = byId[c.waiterId];
        const checkOrders = ordersOfCheck(orders, c.id);
        return {
          check: c,
          waiter: w,
          total: checkTotal(c, checkOrders),
          statusMeta: checkStatusMeta(c.status),
          fiscalMeta: c.fiscal ? fiscalStatusMeta(c.fiscal.status) : null,
        };
      });
  }, [checks, orders, waiters]);

  return (
    <>
      <AdminHeader kicker="Operação" title="Comandas & caixa" />
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-5 md:px-6 lg:px-8">
        {!hydrated ? (
          <Loader />
        ) : (
          <div className="grid gap-4 animate-[mfade_.22s_ease]">
            <div className="rounded-card border border-line bg-white px-5 py-4">
              <h2 className="m-0 mb-0.5 text-[1.08rem] text-navy">Todas as comandas</h2>
              <p className="m-0 text-[0.88rem] text-ink-muted">
                Acompanhe o ciclo de cada comanda — abertura, fechamento, pagamento e
                emissão fiscal.
              </p>
            </div>

            <div className="grid gap-2.5">
              {rows.map(({ check: c, waiter: w, total, statusMeta, fiscalMeta }) => (
                <div
                  key={c.id}
                  className="grid gap-2.5 rounded-card border border-line bg-white px-4 py-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <strong className="text-[1rem] text-navy">
                        Mesa {c.tableNum}
                      </strong>
                      <StatusChip kind={statusMeta.kind}>{statusMeta.label}</StatusChip>
                      {fiscalMeta && (
                        <StatusChip kind={fiscalMeta.kind}>{fiscalMeta.label}</StatusChip>
                      )}
                    </div>
                    <strong className="text-[1.05rem] text-navy">{fmt(total)}</strong>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[0.84rem] text-ink-muted">
                    <span className="inline-flex items-center gap-2">
                      <Avatar
                        initials={w?.initials ?? "--"}
                        color={w?.color ?? "#94a3b8"}
                        size={22}
                      />
                      {w ? firstName(w.name) : "—"} · aberta às {timeOf(c.openedAt)}
                      {c.closedAt ? ` · fechada às ${timeOf(c.closedAt)}` : ""}
                    </span>
                    <span>
                      {c.payment
                        ? `Pagamento: ${PAYMENT_METHOD_LABEL[c.payment.method]}`
                        : "Sem pagamento"}
                      {c.fiscal?.errorMsg ? ` · ${c.fiscal.errorMsg}` : ""}
                    </span>
                  </div>

                  {/* Cashier actions */}
                  {c.status !== "CLOSED" && (
                    <div className="flex flex-wrap gap-2">
                      {c.status === "OPEN" && (
                        <button
                          type="button"
                          disabled={c.draftItems.length > 0}
                          title={
                            c.draftItems.length > 0
                              ? "Há itens não enviados na comanda"
                              : undefined
                          }
                          onClick={() => setCheckoutId(c.id)}
                          className="rounded-[9px] border border-[#dbe2ea] bg-white px-3.5 py-2 text-[0.84rem] font-bold text-[#334155] disabled:cursor-not-allowed disabled:text-[#94a3b8]"
                        >
                          Fechar conta
                        </button>
                      )}
                      {c.status === "IN_CHECKOUT" && !c.payment && (
                        <button
                          type="button"
                          onClick={() => setCheckoutId(c.id)}
                          className="rounded-[9px] bg-[#16a34a] px-3.5 py-2 text-[0.84rem] font-bold text-white"
                        >
                          Registrar pagamento
                        </button>
                      )}
                      {c.fiscal?.status === "ERROR" && (
                        <button
                          type="button"
                          onClick={() => setCheckoutId(c.id)}
                          className="rounded-[9px] bg-[#dc2626] px-3.5 py-2 text-[0.84rem] font-bold text-white"
                        >
                          Resolver erro fiscal
                        </button>
                      )}
                      {c.fiscal?.status === "PROCESSING" && (
                        <button
                          type="button"
                          onClick={() => setCheckoutId(c.id)}
                          className="rounded-[9px] border border-[#dbe2ea] bg-white px-3.5 py-2 text-[0.84rem] font-bold text-[#334155]"
                        >
                          Acompanhar emissão
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {checkoutCheck && (
        <CheckoutModal
          check={checkoutCheck}
          total={chargedTotal(ordersOfCheck(orders, checkoutCheck.id))}
          onClose={() => setCheckoutId(null)}
        />
      )}
    </>
  );
}
