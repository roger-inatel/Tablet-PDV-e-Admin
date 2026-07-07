"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useAppStore } from "@/store/useAppStore";
import { ADMIN_NAV } from "./adminNav";

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAppStore((s) => s.logout);
  const waiters = useAppStore((s) => s.waiters);
  const session = useAppStore((s) => s.session);
  const manager =
    session && session.role === "manager"
      ? waiters.find((w) => w.id === session.waiterId)
      : undefined;

  return (
    <aside className="flex min-w-0 flex-col gap-3 border-b border-white/10 bg-navy px-3 py-3 text-slate-50 md:sticky md:top-0 md:h-screen md:gap-0 md:overflow-y-auto md:border-b-0 md:border-r md:pb-[18px] md:pt-4">
      {/* Brand */}
      <div className="flex items-center gap-2.5 md:mb-2 md:border-b md:border-white/10 md:px-2 md:pb-[18px] md:pt-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-[11px] bg-gradient-to-br from-brand-600 to-[#1e3a8a] text-[0.82rem] font-extrabold text-white shadow-soft">
          M+
        </span>
        <div className="grid min-w-0 gap-px">
          <strong className="text-[0.92rem] font-bold text-slate-100">Mesa+</strong>
          <span className="hidden text-[0.72rem] font-medium text-[#7b8ea6] sm:block">
            Painel Administrativo
          </span>
        </div>
      </div>

      {/* Nav: horizontal scroll on mobile, vertical list on md+ */}
      <nav className="-mx-1 flex gap-1.5 overflow-x-auto px-1 md:mx-0 md:grid md:flex-1 md:content-start md:gap-1 md:overflow-visible md:px-0 md:py-1.5">
        <span className="hidden px-3 py-1.5 text-[0.63rem] font-bold uppercase tracking-[0.13em] text-[#64748b] md:block">
          Operação
        </span>
        {ADMIN_NAV.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex shrink-0 items-center gap-2 rounded-[9px] border px-3 py-2 text-[0.85rem] md:min-h-[44px] md:w-full md:gap-3 md:px-[11px] md:py-[9px] md:text-[0.88rem] ${
                active
                  ? "border-brand-600/30 bg-brand-600/20 font-bold text-[#dbeafe]"
                  : "border-transparent font-medium text-[#94a3b8]"
              }`}
            >
              <span
                className={`inline-flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg border md:h-[30px] md:w-[30px] ${
                  active
                    ? "border-[#60a5fa]/40 bg-[#3b82f6]/30 text-[#93c5fd]"
                    : "border-white/10 bg-white/[0.04] text-[#64748b]"
                }`}
              >
                <Icon name={item.icon} size={16} strokeWidth={2.2} />
              </span>
              <span className="whitespace-nowrap md:min-w-0 md:flex-1 md:truncate">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Manager card — md+ only */}
      <div className="mt-auto hidden gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] p-3 md:grid">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-gradient-to-br from-brand-900 to-[#1e3a5f] text-[0.8rem] font-extrabold text-white">
            {manager?.initials ?? "GR"}
          </span>
          <div className="grid min-w-0 gap-px">
            <span className="text-[0.64rem] font-bold uppercase tracking-[0.1em] text-[#64748b]">
              {manager?.roleLabel ?? "Gerente"}
            </span>
            <strong className="truncate text-[0.84rem] font-semibold text-[#e2e8f0]">
              {manager?.name ?? ""}
            </strong>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            logout();
            router.replace("/login");
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-[9px] border border-[#60a5fa]/30 bg-brand-600/20 px-2.5 py-[9px] text-[0.82rem] font-bold text-[#bfdbfe]"
        >
          Trocar de perfil →
        </button>
      </div>
    </aside>
  );
}
