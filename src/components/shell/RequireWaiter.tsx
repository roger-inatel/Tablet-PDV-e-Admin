"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { Loader } from "@/components/ui/Loader";

/** Gate PDV routes: redirect to /login when no waiter is signed in. */
export function RequireWaiter({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hydrated = useAppStore((s) => s.hydrated);
  const currentWaiterId = useAppStore((s) => s.currentWaiterId);

  useEffect(() => {
    if (hydrated && !currentWaiterId) router.replace("/login");
  }, [hydrated, currentWaiterId, router]);

  if (!hydrated || !currentWaiterId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg">
        <Loader />
      </div>
    );
  }

  return <>{children}</>;
}
