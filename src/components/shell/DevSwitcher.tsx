"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import type { Station } from "@/types";

/**
 * DEV-ONLY quick profile switcher (one tap = set session + navigate).
 * Never rendered in production builds.
 */
export function DevSwitcher() {
  const router = useRouter();
  const enterStation = useAppStore((s) => s.enterStation);
  const waiters = useAppStore((s) => s.waiters);

  if (process.env.NODE_ENV !== "development") return null;

  const goWaiter = (waiterId: string) => {
    const w = waiters.find((x) => x.id === waiterId);
    if (!w) return;
    useAppStore.setState({ session: { role: w.role, waiterId: w.id } });
    router.push(w.role === "manager" ? "/admin" : "/waiter");
  };

  const goStation = (station: Station) => {
    enterStation(station);
    router.push(`/kds/${station}`);
  };

  const btn =
    "rounded-full px-2.5 py-1 text-[0.7rem] font-bold text-slate-300 hover:bg-white/10";

  return (
    <div className="fixed bottom-3 right-3 z-[260] flex items-center gap-0.5 rounded-full bg-navy/90 p-1 opacity-40 shadow-lg transition-opacity hover:opacity-100">
      <span className="px-1.5 text-[0.62rem] font-black uppercase tracking-wider text-slate-500">
        dev
      </span>
      <button type="button" className={btn} onClick={() => goWaiter("carlos")}>
        Garçom
      </button>
      <button type="button" className={btn} onClick={() => goWaiter("renata")}>
        Admin
      </button>
      <button type="button" className={btn} onClick={() => goStation("kitchen")}>
        Cozinha
      </button>
      <button type="button" className={btn} onClick={() => goStation("bar")}>
        Bar
      </button>
    </div>
  );
}
