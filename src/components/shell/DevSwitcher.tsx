"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";

/**
 * DEV-ONLY quick profile switcher (one tap = set session + navigate).
 * Never rendered in production builds.
 */
export function DevSwitcher() {
  const router = useRouter();
  const loginDireto = useAppStore((s) => s.entrarEstacao);
  const garcons = useAppStore((s) => s.garcons);

  if (process.env.NODE_ENV !== "development") return null;

  const irGarcom = (garcomId: string) => {
    const g = garcons.find((x) => x.id === garcomId);
    if (!g) return;
    useAppStore.setState({ sessao: { papel: g.papel, garcomId: g.id } });
    router.push(g.papel === "gerente" ? "/admin" : "/garcom");
  };

  const irEstacao = (estacao: "cozinha" | "bar") => {
    loginDireto(estacao);
    router.push(`/kds/${estacao}`);
  };

  const btn =
    "rounded-full px-2.5 py-1 text-[0.7rem] font-bold text-slate-300 hover:bg-white/10";

  return (
    <div className="fixed bottom-3 right-3 z-[260] flex items-center gap-0.5 rounded-full bg-navy/90 p-1 opacity-40 shadow-lg transition-opacity hover:opacity-100">
      <span className="px-1.5 text-[0.62rem] font-black uppercase tracking-wider text-slate-500">
        dev
      </span>
      <button type="button" className={btn} onClick={() => irGarcom("carlos")}>
        Garçom
      </button>
      <button type="button" className={btn} onClick={() => irGarcom("gerente")}>
        Admin
      </button>
      <button type="button" className={btn} onClick={() => irEstacao("cozinha")}>
        Cozinha
      </button>
      <button type="button" className={btn} onClick={() => irEstacao("bar")}>
        Bar
      </button>
    </div>
  );
}
