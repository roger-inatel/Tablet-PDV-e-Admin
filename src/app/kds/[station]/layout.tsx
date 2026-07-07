"use client";

import { use, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { RequireSession } from "@/components/shell/RequireSession";
import { useAppStore } from "@/store/useAppStore";
import type { Station } from "@/types";

function StationParamGuard({
  station,
  children,
}: {
  station: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const session = useAppStore((s) => s.session);

  const isValid = station === "kitchen" || station === "bar";
  const isMine =
    session?.role === "station" && session.station === (station as Station);

  useEffect(() => {
    if (!isValid) {
      router.replace("/login");
      return;
    }
    // A station tablet can only see its own queue.
    if (session?.role === "station" && !isMine) {
      router.replace(`/kds/${session.station}`);
    }
  }, [isValid, isMine, session, router]);

  if (!isValid || !isMine) return null;
  return <>{children}</>;
}

export default function KdsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ station: string }>;
}) {
  const { station } = use(params);
  return (
    <RequireSession allow={["station"]} dark>
      <StationParamGuard station={station}>
        <main className="flex h-[100dvh] flex-col overflow-hidden bg-navy">
          {children}
        </main>
      </StationParamGuard>
    </RequireSession>
  );
}
