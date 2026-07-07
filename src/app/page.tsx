"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { sessionHome } from "@/components/shell/RequireSession";
import { Loader } from "@/components/ui/Loader";

/** Root: routes each tab to its session's surface (or /login). */
export default function Home() {
  const router = useRouter();
  const hydrated = useAppStore((s) => s.hydrated);
  const session = useAppStore((s) => s.session);

  useEffect(() => {
    if (!hydrated) return;
    router.replace(sessionHome(session));
  }, [hydrated, session, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader />
    </div>
  );
}
