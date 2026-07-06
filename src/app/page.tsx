"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { homeDaSessao } from "@/components/shell/RequireSessao";
import { Loader } from "@/components/ui/Loader";

/** Root: routes each tab to its session's surface (or /login). */
export default function Home() {
  const router = useRouter();
  const hydrated = useAppStore((s) => s.hydrated);
  const sessao = useAppStore((s) => s.sessao);

  useEffect(() => {
    if (!hydrated) return;
    router.replace(homeDaSessao(sessao));
  }, [hydrated, sessao, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader />
    </div>
  );
}
