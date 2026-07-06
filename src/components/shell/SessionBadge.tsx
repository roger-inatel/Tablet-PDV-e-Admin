"use client";

import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { useAppStore } from "@/store/useAppStore";
import { garconsById } from "@/store/selectors";

interface SessionBadgeProps {
  /** Dark chrome (KDS) variant. */
  dark?: boolean;
}

/** Current profile chip + "Sair" — replaces the old ModuleSwitcher. */
export function SessionBadge({ dark }: SessionBadgeProps) {
  const router = useRouter();
  const sessao = useAppStore((s) => s.sessao);
  const garcons = useAppStore((s) => s.garcons);
  const estacoes = useAppStore((s) => s.estacoes);
  const logout = useAppStore((s) => s.logout);

  if (!sessao) return null;

  const sair = () => {
    logout();
    router.replace("/login");
  };

  let avatar: React.ReactNode = null;
  let nome = "";
  let cargo = "";

  if (sessao.papel === "estacao") {
    const est = estacoes.find((e) => e.id === sessao.estacao);
    nome = est?.nome ?? sessao.estacao;
    cargo = "Estação KDS";
    avatar = (
      <span
        className="inline-flex h-8 w-8 items-center justify-center rounded-[9px] text-white"
        style={{ background: est?.cor ?? "#334155" }}
      >
        <Icon name={est?.icone ?? "flame"} size={16} />
      </span>
    );
  } else {
    const g = garconsById(garcons)[sessao.garcomId];
    nome = g?.name ?? "";
    cargo = g?.cargo ?? "";
    avatar = (
      <Avatar initials={g?.initials ?? ""} color={g?.color ?? "#94a3b8"} size={32} />
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2.5 rounded-[12px] border py-1.5 pl-1.5 pr-2 ${
        dark ? "border-white/15 bg-white/[0.06]" : "border-[#dbe2ea] bg-white"
      }`}
    >
      {avatar}
      <div className="hidden min-w-0 leading-tight sm:grid">
        <strong
          className={`truncate text-[0.82rem] ${dark ? "text-slate-100" : "text-navy"}`}
        >
          {nome}
        </strong>
        <span
          className={`text-[0.7rem] ${dark ? "text-slate-400" : "text-ink-muted"}`}
        >
          {cargo}
        </span>
      </div>
      <button
        type="button"
        onClick={sair}
        className={`rounded-[8px] border px-2.5 py-1.5 text-[0.78rem] font-bold ${
          dark
            ? "border-white/15 bg-transparent text-slate-300"
            : "border-[#dbe2ea] bg-white text-[#475569]"
        }`}
      >
        Sair
      </button>
    </div>
  );
}
