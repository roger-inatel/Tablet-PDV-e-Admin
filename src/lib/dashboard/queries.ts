"use client";

import { useQuery } from "@tanstack/react-query";
import type { DashboardData, DashboardPeriodKey } from "./types";

export const PERIOD_LABEL: Record<DashboardPeriodKey, string> = {
  today: "Hoje",
  "7d": "7 dias",
  "30d": "30 dias",
  month: "Mês",
};

/** Resolve a period key to a [from, to) range (client clock). */
export function periodRange(key: DashboardPeriodKey): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date(to);
  switch (key) {
    case "today":
      from.setHours(0, 0, 0, 0);
      break;
    case "7d":
      from.setDate(to.getDate() - 7);
      break;
    case "30d":
      from.setDate(to.getDate() - 30);
      break;
    case "month":
      from.setDate(1);
      from.setHours(0, 0, 0, 0);
      break;
  }
  return { from, to };
}

export function useDashboard(period: DashboardPeriodKey) {
  return useQuery<DashboardData>({
    queryKey: ["dashboard", period],
    queryFn: async () => {
      const { from, to } = periodRange(period);
      const res = await fetch(
        `/api/dashboard?from=${from.toISOString()}&to=${to.toISOString()}`,
      );
      if (!res.ok) throw new Error("Falha ao carregar o painel");
      return (await res.json()) as DashboardData;
    },
  });
}
