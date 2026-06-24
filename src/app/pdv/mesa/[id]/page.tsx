"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ComandaHeader } from "@/components/pdv/ComandaHeader";
import { ComandaGroup } from "@/components/pdv/ComandaGroup";
import { ComandaFooter } from "@/components/pdv/ComandaFooter";
import { CatalogPanel } from "@/components/pdv/CatalogPanel";
import { CatalogDrawer } from "@/components/pdv/CatalogDrawer";
import { PrintModal } from "@/components/pdv/PrintModal";
import { Loader } from "@/components/ui/Loader";
import { useAppStore } from "@/store/useAppStore";
import { waitersById } from "@/store/selectors";
import {
  countByStatus,
  pendingForSector,
  total as totalOf,
} from "@/lib/domain/comanda";
import { firstName } from "@/lib/format";
import { useMediaQuery } from "@/lib/useMediaQuery";
import type { Category, ChipKind } from "@/types";

const SUMMARY_DEFS: { status: "PENDENTE" | "ENVIADO" | "PRONTO"; kind: ChipKind; label: string }[] = [
  { status: "PENDENTE", kind: "neutral", label: "a enviar" },
  { status: "ENVIADO", kind: "blue", label: "enviados" },
  { status: "PRONTO", kind: "green", label: "prontos" },
];

export default function ComandaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const tableId = Number(id);
  const router = useRouter();

  // The side-by-side "Dividido" catalog only fits comfortably on large screens.
  // Below lg we always use the single-column "Foco" flow (catalog as a drawer),
  // which avoids the catalog overlapping the comanda on phones/tablets.
  const canSplit = useMediaQuery("(min-width: 1024px)");

  const hydrated = useAppStore((s) => s.hydrated);
  const tables = useAppStore((s) => s.tables);
  const waiters = useAppStore((s) => s.waiters);
  const products = useAppStore((s) => s.products);
  const categories = useAppStore((s) => s.categories);
  const currentWaiterId = useAppStore((s) => s.currentWaiterId);
  const comandaVariant = useAppStore((s) => s.comandaVariant);
  const setComandaVariant = useAppStore((s) => s.setComandaVariant);
  const addItem = useAppStore((s) => s.addItem);
  const incItem = useAppStore((s) => s.incItem);
  const decItem = useAppStore((s) => s.decItem);
  const advanceItem = useAppStore((s) => s.advanceItem);
  const requestSend = useAppStore((s) => s.requestSend);
  const closeBill = useAppStore((s) => s.closeBill);
  const pushToast = useAppStore((s) => s.pushToast);

  const [catCat, setCatCat] = useState<Category>("Entradas");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const table = tables.find((t) => t.id === tableId);
  const valid =
    !!table && table.status === "ocupada" && table.waiterId === currentWaiterId;

  // Guard: redirect away from invalid/blocked tables (incl. direct URL access).
  useEffect(() => {
    if (!hydrated || valid) return;
    if (table && table.waiterId && table.waiterId !== currentWaiterId) {
      const w = waitersById(waiters)[table.waiterId];
      pushToast(`Mesa de ${w?.name ?? "outro garçom"} · bloqueada`);
    }
    router.replace("/pdv");
  }, [hydrated, valid, table, currentWaiterId, waiters, router, pushToast]);

  const items = useMemo(() => table?.items ?? [], [table]);
  const waiter = currentWaiterId ? waitersById(waiters)[currentWaiterId] : undefined;

  const summary = useMemo(
    () =>
      SUMMARY_DEFS.map((d) => ({
        kind: d.kind,
        label: d.label,
        count: countByStatus(items, d.status),
      })).filter((s) => s.count > 0),
    [items],
  );

  if (!hydrated || !valid || !table) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader />
      </div>
    );
  }

  const dividido = canSplit && comandaVariant === "dividido";
  const cozinhaItems = items.filter((it) => it.sector === "cozinha");
  const barItems = items.filter((it) => it.sector === "bar");
  const empty = items.length === 0;
  const pendCoz = pendingForSector(items, "cozinha");
  const pendBar = pendingForSector(items, "bar");

  const catalogProps = {
    categories,
    products,
    activeCat: catCat,
    onCat: setCatCat,
    onAdd: (productId: string) => addItem(tableId, productId),
  };

  const onClose = async () => {
    await closeBill(tableId);
    router.replace("/pdv");
  };

  return (
    <div className="relative flex h-full flex-col">
      <ComandaHeader
        tableNum={table.num}
        seats={table.seats}
        waiterFirst={waiter ? firstName(waiter.name) : ""}
        summary={summary}
        variant={comandaVariant}
        showToggle={canSplit}
        onVariant={(v) => {
          setComandaVariant(v);
          setDrawerOpen(false);
        }}
        onBack={() => router.push("/pdv")}
      />

      <div
        className="grid min-h-0 flex-1"
        style={{
          gridTemplateColumns: dividido ? "minmax(0,1fr) 358px" : "minmax(0,1fr)",
        }}
      >
        <div
          className={`flex min-h-0 flex-col ${dividido ? "border-r border-line" : ""}`}
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
                <ComandaGroup
                  sector="cozinha"
                  items={cozinhaItems}
                  onInc={(k) => incItem(tableId, k)}
                  onDec={(k) => decItem(tableId, k)}
                  onAdvance={(k) => advanceItem(tableId, k)}
                />
                <ComandaGroup
                  sector="bar"
                  items={barItems}
                  onInc={(k) => incItem(tableId, k)}
                  onDec={(k) => decItem(tableId, k)}
                  onAdvance={(k) => advanceItem(tableId, k)}
                />
              </div>
            )}
          </div>

          {/* In "Foco"/mobile: add-items lives in the flow (no floating FAB → no overlap). */}
          {!dividido && (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="pdv-chrome flex items-center justify-center gap-2 border-t border-line bg-[#1f4e79] px-4 py-3 text-[0.95rem] font-extrabold text-white md:px-6 lg:px-8"
            >
              + Adicionar itens
            </button>
          )}

          <ComandaFooter
            total={totalOf(items)}
            pendCoz={pendCoz}
            pendBar={pendBar}
            onSendCoz={() => requestSend(tableId, "cozinha")}
            onSendBar={() => requestSend(tableId, "bar")}
            onClose={onClose}
          />
        </div>

        {dividido && <CatalogPanel {...catalogProps} cols={1} />}
      </div>

      {!dividido && drawerOpen && (
        <CatalogDrawer {...catalogProps} onClose={() => setDrawerOpen(false)} />
      )}

      <PrintModal />
    </div>
  );
}
