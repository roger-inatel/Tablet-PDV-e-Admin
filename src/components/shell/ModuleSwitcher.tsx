"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";

/** Fixed bottom pill that jumps between the Admin panel and the waiter PDV. */
export function ModuleSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const currentWaiterId = useAppStore((s) => s.currentWaiterId);

  // Hidden on the login screen and inside the comanda (focused task screen,
  // where the fixed pill would overlap the action footer).
  if (pathname === "/login" || pathname.startsWith("/pdv/mesa/")) return null;

  const isAdmin = pathname.startsWith("/admin");
  const base = "rounded-full px-[18px] py-[9px] text-[0.86rem] font-bold transition";

  return (
    <div className="fixed bottom-4 left-1/2 z-[250] flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2 gap-1 rounded-full bg-navy p-[5px] shadow-[0_18px_40px_-14px_rgba(15,23,42,.6)]">
      <button
        type="button"
        onClick={() => router.push("/admin")}
        className={`${base} ${isAdmin ? "bg-white text-ink" : "bg-transparent text-[#94a3b8]"}`}
      >
        Painel Admin
      </button>
      <button
        type="button"
        onClick={() => router.push(currentWaiterId ? "/pdv" : "/login")}
        className={`${base} ${!isAdmin ? "bg-white text-ink" : "bg-transparent text-[#94a3b8]"}`}
      >
        PDV Garçom
      </button>
    </div>
  );
}
