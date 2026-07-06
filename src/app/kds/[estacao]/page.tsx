"use client";

import { use } from "react";
import { KdsHeader } from "@/components/kds/KdsHeader";
import { KdsBoard } from "@/components/kds/KdsBoard";
import type { Estacao } from "@/types";

// Kitchen Display System: the station's live queue. New pedidos arrive via
// realtime events; item statuses are advanced HERE (waiters only observe).
export default function KdsPage({
  params,
}: {
  params: Promise<{ estacao: string }>;
}) {
  const { estacao } = use(params);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <KdsHeader estacao={estacao as Estacao} />
      <KdsBoard estacao={estacao as Estacao} />
    </div>
  );
}
