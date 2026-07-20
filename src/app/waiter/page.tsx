"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { WaiterHeader } from "@/components/waiter/WaiterHeader";
import { TableCard } from "@/components/waiter/TableCard";
import { TableLegend } from "@/components/waiter/TableLegend";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { useAppStore } from "@/store/useAppStore";
import { tableViews, type TableView } from "@/store/selectors";
import type { TablesVariant } from "@/types";

export default function WaiterTablesPage() {
  const router = useRouter();
  const session = useAppStore((s) => s.session);
  const tables = useAppStore((s) => s.tables);
  const checks = useAppStore((s) => s.checks);
  const orders = useAppStore((s) => s.orders);
  const waiters = useAppStore((s) => s.waiters);
  const tablesVariant = useAppStore((s) => s.tablesVariant);
  const setTablesVariant = useAppStore((s) => s.setTablesVariant);
  const openCheck = useAppStore((s) => s.openCheck);

  const detailed = tablesVariant === "detailed";

  const views = useMemo(
    () => tableViews(tables, checks, orders, waiters, session),
    [tables, checks, orders, waiters, session],
  );

  const onCardClick = async (view: TableView) => {
    // Checkout requested → the cashier owns it; the tile is read-only.
    if (view.locked) return;
    if (view.kind === "free") {
      const check = await openCheck(view.table.id);
      if (check) router.push(`/waiter/table/${view.table.id}`);
      return;
    }
    // "mine" opens for edits; "other" opens read-only (consulta).
    router.push(`/waiter/table/${view.table.id}`);
  };

  return (
    <div className="flex h-full flex-col">
      <WaiterHeader />

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-3.5 lg:px-8">
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <h2 className="m-0 text-[1.15rem] text-navy">Mesas</h2>
          <TableLegend />
        </div>
        <SegmentedToggle<TablesVariant>
          value={tablesVariant}
          onChange={setTablesVariant}
          options={[
            { value: "detailed", label: "Detalhado" },
            { value: "compact", label: "Compacto" },
          ]}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-10 pt-1 md:px-6 lg:px-8">
        <div
          className="grid gap-[13px]"
          style={{
            gridTemplateColumns: `repeat(auto-fill,minmax(${
              detailed ? "208px" : "146px"
            },1fr))`,
          }}
        >
          {views.map((v) => (
            <TableCard
              key={v.table.id}
              view={v}
              detailed={detailed}
              onClick={() => onCardClick(v)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
