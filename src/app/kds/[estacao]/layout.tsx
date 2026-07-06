"use client";

import { use, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { RequireSessao } from "@/components/shell/RequireSessao";
import { useAppStore } from "@/store/useAppStore";
import type { Estacao } from "@/types";

function EstacaoParamGuard({
  estacao,
  children,
}: {
  estacao: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const sessao = useAppStore((s) => s.sessao);

  const valida = estacao === "cozinha" || estacao === "bar";
  const minha =
    sessao?.papel === "estacao" && sessao.estacao === (estacao as Estacao);

  useEffect(() => {
    if (!valida) {
      router.replace("/login");
      return;
    }
    // A station tablet can only see its own queue.
    if (sessao?.papel === "estacao" && !minha) {
      router.replace(`/kds/${sessao.estacao}`);
    }
  }, [valida, minha, sessao, router]);

  if (!valida || !minha) return null;
  return <>{children}</>;
}

export default function KdsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ estacao: string }>;
}) {
  const { estacao } = use(params);
  return (
    <RequireSessao permitir={["estacao"]} dark>
      <EstacaoParamGuard estacao={estacao}>
        <main className="flex h-[100dvh] flex-col overflow-hidden bg-navy">
          {children}
        </main>
      </EstacaoParamGuard>
    </RequireSessao>
  );
}
