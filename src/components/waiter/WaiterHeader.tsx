"use client";

import { useMemo } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { SessionBadge } from "@/components/shell/SessionBadge";
import { useAppStore } from "@/store/useAppStore";
import { myTablesCount, tableViews, waitersById } from "@/store/selectors";
import { firstName } from "@/lib/format";

export function WaiterHeader() {
  const session = useAppStore((s) => s.session);
  const waiters = useAppStore((s) => s.waiters);
  const tables = useAppStore((s) => s.tables);
  const checks = useAppStore((s) => s.checks);
  const orders = useAppStore((s) => s.orders);

  const waiter =
    session && session.role !== "station"
      ? waitersById(waiters)[session.waiterId]
      : undefined;

  const myTables = useMemo(
    () => myTablesCount(tableViews(tables, checks, orders, waiters, session)),
    [tables, checks, orders, waiters, session],
  );

  return (
    <div className="pos-chrome flex items-center justify-between gap-2 border-b border-line bg-white px-4 py-3.5 md:px-6 md:py-4 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar
          initials={waiter?.initials ?? ""}
          color={waiter?.color ?? "#94a3b8"}
          size={40}
        />
        <div className="min-w-0">
          <div className="truncate text-[1.05rem] font-extrabold text-navy">
            Olá, {waiter ? firstName(waiter.name) : ""}
          </div>
          <div className="truncate text-[0.82rem] text-ink-muted">
            {waiter?.roleLabel ?? ""} · Bistrô Central
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        <div className="mr-1 hidden text-right leading-tight sm:block">
          <div className="text-[0.78rem] text-ink-muted">Suas mesas</div>
          <div className="text-[1.05rem] font-extrabold text-[#1f4e79]">
            {myTables}
          </div>
        </div>
        <SessionBadge />
      </div>
    </div>
  );
}
