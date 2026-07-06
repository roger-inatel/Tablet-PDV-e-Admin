"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Papel, Sessao } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { Loader } from "@/components/ui/Loader";

/** Home surface of a session (where mismatched roles are sent back to). */
export function homeDaSessao(sessao: Sessao | null): string {
  if (!sessao) return "/login";
  switch (sessao.papel) {
    case "garcom":
      return "/garcom";
    case "gerente":
      return "/admin";
    case "estacao":
      return `/kds/${sessao.estacao}`;
  }
}

interface RequireSessaoProps {
  permitir: Papel[];
  children: ReactNode;
  dark?: boolean;
}

/**
 * Role guard for a surface. No session -> /login; wrong role -> the session's
 * own home surface. Waits for hydration before deciding (no redirect flicker).
 */
export function RequireSessao({ permitir, children, dark }: RequireSessaoProps) {
  const router = useRouter();
  const hydrated = useAppStore((s) => s.hydrated);
  const sessao = useAppStore((s) => s.sessao);

  const ok = sessao !== null && permitir.includes(sessao.papel);

  useEffect(() => {
    if (!hydrated || ok) return;
    router.replace(homeDaSessao(sessao));
  }, [hydrated, ok, sessao, router]);

  if (!hydrated || !ok) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${
          dark ? "bg-navy" : "bg-app-bg"
        }`}
      >
        <Loader dark={dark} />
      </div>
    );
  }

  return <>{children}</>;
}
