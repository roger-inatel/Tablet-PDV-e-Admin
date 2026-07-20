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
import { Modal } from "@/components/ui/Modal";
import { Loader } from "@/components/ui/Loader";
import { useAppStore } from "@/store/useAppStore";
import { checkById, ordersOfCheck, waitersById } from "@/store/selectors";
import { checkItemCounts } from "@/lib/domain/check";
import { checkTotal } from "@/lib/domain/order";
import { canEditDraft, isAssignedWaiter } from "@/lib/domain/permissions";
import { fmt, firstName } from "@/lib/format";
import { useMediaQuery } from "@/lib/useMediaQuery";
import type { Category, OrderPriority } from "@/types";

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
  const setDraftItemNote = useAppStore((s) => s.setDraftItemNote);
  const sendOrderAction = useAppStore((s) => s.sendOrder);
  const startCheckout = useAppStore((s) => s.startCheckout);
  const markTableNotificationsRead = useAppStore(
    (s) => s.markTableNotificationsRead,
  );

  const [activeCategory, setActiveCategory] = useState<Category>("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [closeConfirm, setCloseConfirm] = useState(false);
  const [closing, setClosing] = useState(false);

  const table = tables.find((t) => t.id === tableId);
  const check = checkById(checks, table?.checkId ?? null);
  const valid = !!table && !!check;

  // Free/unknown table via direct URL -> back to the grid.
  useEffect(() => {
    if (!hydrated) return;
    if (!valid) router.replace("/waiter");
  }, [hydrated, valid, router]);

  // Once the check leaves OPEN (checkout requested), it becomes the cashier's
  // responsibility — the assigned waiter is routed back to the grid.
  useEffect(() => {
    if (!hydrated || !check) return;
    if (check.status !== "OPEN" && isAssignedWaiter(session, check)) {
      router.replace("/waiter");
    }
  }, [hydrated, check, session, router]);

  // Opening the table acknowledges its "order ready" alerts.
  useEffect(() => {
    if (!hydrated) return;
    markTableNotificationsRead(tableId);
  }, [hydrated, tableId, markTableNotificationsRead]);

  // Categories load async from the catalog — default to the first one once available.
  useEffect(() => {
    if (categories.length === 0) return;
    if (!activeCategory || !categories.includes(activeCategory)) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

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

  const confirmSend = async (priority: OrderPriority) => {
    setSending(true);
    const ok = await sendOrderAction(check.id, priority);
    setSending(false);
    if (ok) setSendOpen(false);
  };

  const confirmClose = async () => {
    setClosing(true);
    const ok = await startCheckout(check.id);
    setClosing(false);
    setCloseConfirm(false);
    if (ok) router.push("/waiter");
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
            Aguardando pagamento · responsabilidade do caixa
          </span>
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
                  onNote={(k, notes) => setDraftItemNote(check.id, k, notes)}
                />
                <CheckOrders orders={checkOrders} check={check} />
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
              onCheckout={() => setCloseConfirm(true)}
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

      {closeConfirm && (
        <Modal onClose={() => setCloseConfirm(false)}>
          <div className="flex items-center gap-3.5 bg-gradient-to-br from-[#1f4e79] to-[#1e3a8a] px-[22px] py-[18px] text-white">
            <div>
              <div className="text-[1.1rem] font-extrabold">
                Fechar conta · Mesa {check.tableNum}
              </div>
              <div className="text-[0.84rem] opacity-85">
                O pagamento é feito pelo caixa
              </div>
            </div>
          </div>
          <div className="grid gap-4 px-[22px] py-[18px]">
            <p className="m-0 text-[0.9rem] text-ink-muted">
              A comanda será enviada ao caixa e a mesa ficará{" "}
              <strong className="text-[#b45309]">bloqueada para pagamento</strong>.
              Você não recebe pagamento — apenas solicita o encerramento do consumo.
            </p>
            <div className="flex items-center justify-between rounded-[11px] border border-[#eef1f6] bg-[#fbfcfe] px-3.5 py-3">
              <span className="text-[0.9rem] font-semibold text-ink-muted">
                Total da comanda
              </span>
              <strong className="text-[1.35rem] text-navy">{fmt(total)}</strong>
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setCloseConfirm(false)}
                className="flex-1 rounded-[11px] border border-[#dbe2ea] bg-white py-[13px] text-[0.92rem] font-bold text-[#334155]"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={closing}
                onClick={confirmClose}
                className="flex-1 rounded-[11px] bg-[#1f4e79] py-[13px] text-[0.92rem] font-extrabold text-white disabled:cursor-not-allowed disabled:bg-[#cbd5e1]"
              >
                {closing ? "Enviando…" : "Enviar ao caixa"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
