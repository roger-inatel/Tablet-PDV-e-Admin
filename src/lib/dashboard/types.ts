// DTOs for the managerial dashboard. Financial/sales metrics are aggregated
// server-side from the real ERP (TB_PEDIDO/ITEM/PARCELA) — see
// src/app/api/dashboard/route.ts. Operational/removal metrics are derived
// client-side from the live store.

export interface DashboardSummary {
  orders: number;
  revenue: number;
  avgTicket: number;
  discountTotal: number;
  serviceFeeTotal: number;
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
}

export interface SalesPoint {
  /** ISO date (yyyy-mm-dd). */
  date: string;
  revenue: number;
  orders: number;
}

export interface PaymentSlice {
  method: string; // label (pt-BR)
  total: number;
  count: number;
}

export interface ProductRank {
  productId: string;
  name: string;
  qty: number;
  revenue: number;
}

export interface HeatCell {
  /** 1 (Sun) .. 7 (Sat) per SQL Server DATEPART(WEEKDAY). */
  weekday: number;
  /** 0 .. 23 */
  hour: number;
  orders: number;
}

/** The full dashboard payload for a period. `available:false` = DB not configured. */
export interface DashboardData {
  available: boolean;
  summary?: DashboardSummary;
  salesByDay?: SalesPoint[];
  payments?: PaymentSlice[];
  productRanking?: ProductRank[];
  heatmap?: HeatCell[];
}

export type DashboardPeriodKey = "today" | "7d" | "30d" | "month";
