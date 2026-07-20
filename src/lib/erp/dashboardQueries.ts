import { prisma } from "@/lib/prisma";
import type {
  DashboardData,
  HeatCell,
  PaymentSlice,
  ProductRank,
  SalesPoint,
} from "@/lib/dashboard/types";

// Server-side aggregation over the real ERP order tables. All heavy lifting
// happens in SQL (never ships rows to the client). Filtered to POS orders
// (FL_PDV = 1). Requires DATABASE_URL — the route guards it and imports this
// module dynamically so an env-less dev never throws at import.

const FORMA_LABEL: Record<number, string> = {
  1: "Dinheiro",
  3: "Cartão",
  11: "PIX",
};

function n(value: number | bigint | null | undefined): number {
  return value == null ? 0 : Number(value);
}

function toISODate(d: Date | string): string {
  return typeof d === "string" ? d.slice(0, 10) : d.toISOString().slice(0, 10);
}

async function scalarRevenue(from: Date): Promise<number> {
  const rows = await prisma.$queryRaw<{ revenue: number | null }[]>`
    SELECT SUM(VL_FINANCEIRO) AS revenue
    FROM dbo.TB_PEDIDO
    WHERE FL_PDV = 1 AND DT_PEDIDO >= ${from}`;
  return n(rows[0]?.revenue);
}

export async function getDashboard(from: Date, to: Date): Promise<DashboardData> {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startWeek = new Date(now);
  startWeek.setDate(now.getDate() - 7);
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [summaryRows, revToday, revWeek, revMonth, sales, payments, products, heat] =
    await Promise.all([
      prisma.$queryRaw<
        { orders: number | bigint; revenue: number | null; discount: number | null; fee: number | null }[]
      >`
        SELECT COUNT(*) AS orders, SUM(VL_FINANCEIRO) AS revenue,
               SUM(VL_DESCONTO) AS discount, SUM(VL_ACRESCIMO) AS fee
        FROM dbo.TB_PEDIDO
        WHERE FL_PDV = 1 AND DT_PEDIDO >= ${from} AND DT_PEDIDO < ${to}`,
      scalarRevenue(startToday),
      scalarRevenue(startWeek),
      scalarRevenue(startMonth),
      prisma.$queryRaw<{ d: Date; revenue: number | null; orders: number | bigint }[]>`
        SELECT CAST(DT_PEDIDO AS date) AS d, SUM(VL_FINANCEIRO) AS revenue, COUNT(*) AS orders
        FROM dbo.TB_PEDIDO
        WHERE FL_PDV = 1 AND DT_PEDIDO >= ${from} AND DT_PEDIDO < ${to}
        GROUP BY CAST(DT_PEDIDO AS date)
        ORDER BY CAST(DT_PEDIDO AS date)`,
      prisma.$queryRaw<{ forma: number; total: number | null; cnt: number | bigint }[]>`
        SELECT pp.ID_FORMA_PAGTO AS forma, SUM(pp.VL_RECEBIDO) AS total, COUNT(*) AS cnt
        FROM dbo.TB_PEDIDO_PARCELA pp
        JOIN dbo.TB_PEDIDO p ON p.ID_PEDIDO = pp.ID_PEDIDO
        WHERE p.FL_PDV = 1 AND p.DT_PEDIDO >= ${from} AND p.DT_PEDIDO < ${to}
        GROUP BY pp.ID_FORMA_PAGTO`,
      prisma.$queryRaw<
        { id: number; name: string; qty: number | null; revenue: number | null }[]
      >`
        SELECT TOP 10 pi.ID_PRODUTO AS id, pr.DS_PRODUTO AS name,
               SUM(pi.QTD_VENDA) AS qty, SUM(pi.VL_PRODUTO) AS revenue
        FROM dbo.TB_PEDIDO_ITEM pi
        JOIN dbo.TB_PEDIDO p ON p.ID_PEDIDO = pi.ID_PEDIDO
        JOIN dbo.TB_PRODUTO pr ON pr.ID_PRODUTO = pi.ID_PRODUTO
        WHERE p.FL_PDV = 1 AND p.DT_PEDIDO >= ${from} AND p.DT_PEDIDO < ${to}
        GROUP BY pi.ID_PRODUTO, pr.DS_PRODUTO
        ORDER BY SUM(pi.QTD_VENDA) DESC`,
      prisma.$queryRaw<{ weekday: number; hour: number; orders: number | bigint }[]>`
        SELECT DATEPART(WEEKDAY, DT_PEDIDO) AS weekday,
               DATEPART(HOUR, DT_PEDIDO) AS hour, COUNT(*) AS orders
        FROM dbo.TB_PEDIDO
        WHERE FL_PDV = 1 AND DT_PEDIDO >= ${from} AND DT_PEDIDO < ${to}
        GROUP BY DATEPART(WEEKDAY, DT_PEDIDO), DATEPART(HOUR, DT_PEDIDO)`,
    ]);

  const s = summaryRows[0];
  const orders = n(s?.orders);
  const revenue = n(s?.revenue);

  const salesByDay: SalesPoint[] = sales.map((r) => ({
    date: toISODate(r.d),
    revenue: n(r.revenue),
    orders: n(r.orders),
  }));
  const paymentSlices: PaymentSlice[] = payments.map((r) => ({
    method: FORMA_LABEL[n(r.forma)] ?? `Forma ${r.forma}`,
    total: n(r.total),
    count: n(r.cnt),
  }));
  const productRanking: ProductRank[] = products.map((r) => ({
    productId: String(r.id),
    name: r.name,
    qty: n(r.qty),
    revenue: n(r.revenue),
  }));
  const heatmap: HeatCell[] = heat.map((r) => ({
    weekday: n(r.weekday),
    hour: n(r.hour),
    orders: n(r.orders),
  }));

  return {
    available: true,
    summary: {
      orders,
      revenue,
      avgTicket: orders ? revenue / orders : 0,
      discountTotal: n(s?.discount),
      serviceFeeTotal: n(s?.fee),
      revenueToday: revToday,
      revenueWeek: revWeek,
      revenueMonth: revMonth,
    },
    salesByDay,
    payments: paymentSlices,
    productRanking,
    heatmap,
  };
}
