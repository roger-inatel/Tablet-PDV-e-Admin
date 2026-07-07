"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckHeader } from "@/components/waiter/CheckHeader";
import { CheckDrafts } from "@/components/waiter/CheckDrafts";
import { CheckOrders } from "@/components/waiter/CheckOrders";
import { CheckFooter } from "@/components/waiter/CheckFooter";
import { CatalogPanel } from "@/components/waiter/CatalogPanel";
import { CatalogDrawer } from "@/components/waiter/CatalogDrawer";
import { SendOrderModal } from "@/components/waiter/SendOrderModal";
import { CheckoutModal } from "@/components/check/CheckoutModal";
import { Loader } from "@/components/ui/Loader";
import { useAppStore } from "@/store/useAppStore";
import { checkById, ordersOfCheck, waitersById } from "@/store/selectors";
import { checkItemCounts } from "@/lib/domain/check";
import { chargedTotal, checkTotal } from "@/lib/domain/order";
import {
  canCancelCheckout,
  canEditDraft,
  isAssignedWaiter,
} from "@/lib/domain/permissions";
import { firstName } from "@/lib/format";
import { useMediaQuery } from "@/lib/useMediaQuery";
import type { Category } from "@/types";

export default function CheckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const tableId = Number(id);
  const router = useRouter();

  // Side-by-side catalog only fits on large screens; below lg the catalog is
  // a bottom drawer (single-column "Foco" flow).
  const canSplit = useMediaQuery("(min-width: 1024px)");

  const hydrated = useAppStore((s) => s.hydrated);
  const session = useAppStore((s) => s.session);
  const tables = useAppStore((s) => s.tables);
  const checks = useAppStore((s) => s.checks);
  const orders = useAppStore((s) => s.orders);
  const waiters = useAppStore((s) => s.waiters);
  const products = useAppStore((s) => s.products);
  const categories = useAppStore((s) => s.categories);
  const checkVariant = useAppStore((s) => s.checkVariant);
  const setCheckVariant = useAppStore((s) => s.setCheckVariant);
  const addDraftItem = useAppStore((s) => s.addDraftItem);
  const incDraftItem = useAppStore((s) => s.incDraftItem);
  const decDraftItem = useAppStore((s) => s.decDraftItem);
  const sendOrderAction = useAppStore((s) => s.sendOrder);
  const cancelCheckout = useAppStore((s) => s.cancelCheckout);

  const [activeCategory, setActiveCategory] = useState<Category>("Entradas");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [sending, setSending] = useState(false);
  // Pinned check id while the checkout modal is open — keeps the success
  // screen visible after check.closed frees the table (checkId -> null).
  const [checkoutCheckId, setCheckoutCheckId] = useState<string | null>(null);

  const table = tables.find((t) => t.id === tableId);
  const activeCheck = checkById(checks, table?.checkId ?? null);
  const checkoutCheck = checkoutCheckId
    ? checks.find((c) => c.id === checkoutCheckId)
    : undefined;
  const check = activeCheck ?? checkoutCheck;
  const valid = !!table && !!check;

  // Free/unknown table via direct URL -> back to the grid.
  useEffect(() => {
    if (!hydrated) return;
    if (!valid) router.replace("/waiter");
  }, [hydrated, valid, router]);

  const checkOrders = useMemo(
    () => (check ? ordersOfCheck(orders, check.id) : []),
    [orders, check],
  );

  const counts = useMemo(
    () =>
      check
        ? checkItemCounts(check, checkOrders)
        : {
            toSend: 0,
            byStatus: { SENT: 0, RECEIVED: 0, PREPARING: 0, READY: 0 },
          },
    [check, checkOrders],
  );

  if (!hydrated || !valid || !check) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader />
      </div>
    );
  }

  const readOnly = !isAssignedWaiter(session, check);
  const editable = canEditDraft(session, check);
  const inCheckout = check.status === "IN_CHECKOUT";
  const assignedWaiter = waitersById(waiters)[check.waiterId];
  const total = checkTotal(check, checkOrders);
  const empty = check.draftItems.length === 0 && checkOrders.length === 0;
  const split = canSplit && checkVariant === "split" && editable;

  const catalogProps = {
    categories,
    products,
    activeCategory,
    onCategory: setActiveCategory,
    onAdd: (productId: string) => addDraftItem(check.id, productId),
  };

  const confirmSend = async () => {
    setSending(true);
    const ok = await sendOrderAction(check.id);
    setSending(false);
    if (ok) setSendOpen(false);
  };

  return (
    <div className="relative flex h-full flex-col">
      <CheckHeader
        tableNum={check.tableNum}
        seats={table.seats}
        waiterName={assignedWaiter ? firstName(assignedWaiter.name) : ""}
        readOnly={readOnly}
        counts={counts}
        variant={checkVariant}
        showToggle={canSplit && editable}
        onVariant={(v) => {
          setCheckVariant(v);
          setDrawerOpen(false);
        }}
        onBack={() => router.push("/waiter")}
      />

      {inCheckout && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#fde68a] bg-[#fffbeb] px-4 py-2.5 md:px-6 lg:px-8">
          <span className="text-[0.86rem] font-semibold text-[#92400e]">
            {check.fiscal?.status === "ERROR"
              ? "Erro na emissão fiscal · reemissão pelo caixa"
              : check.payment
                ? "Pagamento registrado · emitindo NFC-e"
                : "Em fechamento · aguardando pagamento"}
          </span>
          <div className="flex gap-2">
            {!readOnly && (
              <button
                type="button"
                onClick={() => setCheckoutCheckId(check.id)}
                className="rounded-[8px] bg-[#92400e] px-3 py-1.5 text-[0.8rem] font-bold text-white"
              >
                Abrir fechamento
              </button>
            )}
            {canCancelCheckout(session, check) && (
              <button
                type="button"
                onClick={() => cancelCheckout(check.id)}
                className="rounded-[8px] border border-[#fcd34d] bg-white px-3 py-1.5 text-[0.8rem] font-bold text-[#92400e]"
              >
                Cancelar fechamento
              </button>
            )}
          </div>
        </div>
      )}

      <div
        className="grid min-h-0 flex-1"
        style={{
          gridTemplateColumns: split ? "minmax(0,1fr) 358px" : "minmax(0,1fr)",
        }}
      >
        <div
          className={`flex min-h-0 flex-col ${split ? "border-r border-line" : ""}`}
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-[18px] lg:px-8">
            {empty ? (
              <div className="px-5 py-16 text-center text-[#94a3b8]">
                <div className="mb-1.5 text-[1.05rem] font-bold text-[#475569]">
                  Comanda vazia
                </div>
                <div className="text-[0.9rem]">
                  Adicione itens pelo catálogo para começar o pedido.
                </div>
              </div>
            ) : (
              <div className="grid gap-[18px]">
                <CheckDrafts
                  drafts={check.draftItems}
                  editable={editable}
                  onInc={(k) => incDraftItem(check.id, k)}
                  onDec={(k) => decDraftItem(check.id, k)}
                />
                <CheckOrders orders={checkOrders} />
              </div>
            )}
          </div>

          {/* Focus/mobile: in-flow add button (no floating FAB, no overlap). */}
          {editable && !split && (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="pos-chrome flex items-center justify-center gap-2 border-t border-line bg-[#1f4e79] px-4 py-3 text-[0.95rem] font-extrabold text-white md:px-6 lg:px-8"
            >
              + Adicionar itens
            </button>
          )}

          {!readOnly && check.status === "OPEN" && (
            <CheckFooter
              total={total}
              toSend={counts.toSend}
              onSend={() => setSendOpen(true)}
              onCheckout={() => setCheckoutCheckId(check.id)}
            />
          )}
        </div>

        {split && <CatalogPanel {...catalogProps} cols={1} />}
      </div>

      {editable && !split && drawerOpen && (
        <CatalogDrawer {...catalogProps} onClose={() => setDrawerOpen(false)} />
      )}

      {sendOpen && (
        <SendOrderModal
          drafts={check.draftItems}
          sending={sending}
          onClose={() => setSendOpen(false)}
          onConfirm={confirmSend}
        />
      )}

      {checkoutCheckId && checkoutCheck && (
        <CheckoutModal
          check={checkoutCheck}
          total={chargedTotal(checkOrders)}
          onClose={() => {
            const wasClosed = checkoutCheck.status === "CLOSED";
            setCheckoutCheckId(null);
            if (wasClosed) router.replace("/waiter");
          }}
        />
      )}
    </div>
  );
}
