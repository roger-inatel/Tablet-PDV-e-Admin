"use client";

import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { useAppStore } from "@/store/useAppStore";
import { tablesForWaiter, waitersById } from "@/store/selectors";
import { firstName } from "@/lib/format";

export function PdvHeader() {
  const router = useRouter();
  const waiters = useAppStore((s) => s.waiters);
  const tables = useAppStore((s) => s.tables);
  const currentWaiterId = useAppStore((s) => s.currentWaiterId);
  const logout = useAppStore((s) => s.logout);

  const waiter = currentWaiterId ? waitersById(waiters)[currentWaiterId] : undefined;
  const minhasMesas = tablesForWaiter(tables, currentWaiterId).length;

  const onLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="pdv-chrome flex items-center justify-between gap-2 border-b border-line bg-white px-4 py-3.5 md:px-6 md:py-4 lg:px-8">
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
            {waiter?.role ?? ""} · Bistrô Central
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        <div className="mr-1 hidden text-right leading-tight sm:block">
          <div className="text-[0.78rem] text-ink-muted">Suas mesas</div>
          <div className="text-[1.05rem] font-extrabold text-[#1f4e79]">{minhasMesas}</div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#dbe2ea] bg-white px-3.5 py-2.5 text-[0.86rem] font-bold text-[#475569]"
        >
          Sair
        </button>
      </div>
    </div>
  );
}
