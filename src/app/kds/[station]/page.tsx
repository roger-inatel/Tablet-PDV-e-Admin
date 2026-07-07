"use client";

import { use } from "react";
import { KdsHeader } from "@/components/kds/KdsHeader";
import { KdsBoard } from "@/components/kds/KdsBoard";
import type { Station } from "@/types";

// Kitchen Display System: the station's live queue. New orders arrive via
// realtime events; item statuses are advanced HERE (waiters only observe).
export default function KdsPage({
  params,
}: {
  params: Promise<{ station: string }>;
}) {
  const { station } = use(params);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <KdsHeader station={station as Station} />
      <KdsBoard station={station as Station} />
    </div>
  );
}
