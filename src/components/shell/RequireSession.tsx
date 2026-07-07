"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Role, Session } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { Loader } from "@/components/ui/Loader";

/** Home surface of a session (where mismatched roles are sent back to). */
export function sessionHome(session: Session | null): string {
  if (!session) return "/login";
  switch (session.role) {
    case "waiter":
      return "/waiter";
    case "manager":
      return "/admin";
    case "station":
      return `/kds/${session.station}`;
  }
}

interface RequireSessionProps {
  allow: Role[];
  children: ReactNode;
  dark?: boolean;
}

/**
 * Role guard for a surface. No session -> /login; wrong role -> the session's
 * own home surface. Waits for hydration before deciding (no redirect flicker).
 */
export function RequireSession({ allow, children, dark }: RequireSessionProps) {
  const router = useRouter();
  const hydrated = useAppStore((s) => s.hydrated);
  const session = useAppStore((s) => s.session);

  const ok = session !== null && allow.includes(session.role);

  useEffect(() => {
    if (!hydrated || ok) return;
    router.replace(sessionHome(session));
  }, [hydrated, ok, session, router]);

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
