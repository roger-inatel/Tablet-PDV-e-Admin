"use client";

import { useQuery } from "@tanstack/react-query";
import type { AuditFilters, AuditRow } from "./index";

// Reads the permanent audit from APP_REMOCAO_AUDITORIA through
// /api/removals/list (filtering happens in SQL). When the database isn't
// configured — or the table isn't provisioned — the route answers
// { available:false } and the page falls back to the local records.

interface AuditResponse {
  available: boolean;
  rows?: AuditRow[];
  total?: number;
}

/** Server cap; the page paginates locally and exports the whole filtered set. */
const MAX_ROWS = 500;

export function useAuditRows(filters: AuditFilters) {
  return useQuery<AuditResponse>({
    queryKey: ["audit", filters],
    queryFn: async () => {
      const p = new URLSearchParams({ page: "1", pageSize: String(MAX_ROWS) });
      if (filters.from) p.set("from", filters.from);
      if (filters.to) p.set("to", filters.to);
      if (filters.waiterId) p.set("waiterId", filters.waiterId);
      if (filters.tableNum != null) p.set("tableNum", String(filters.tableNum));
      if (filters.product) p.set("product", filters.product);
      if (filters.status && filters.status !== "ALL") p.set("status", filters.status);

      const res = await fetch(`/api/removals/list?${p.toString()}`);
      if (!res.ok) return { available: false };
      return (await res.json()) as AuditResponse;
    },
  });
}
