import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function parseDate(value: string | null, fallback: Date): Date {
  if (!value) return fallback;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

export async function GET(request: NextRequest) {
  // Degrade gracefully when the DB isn't configured: the UI still renders the
  // live operational KPIs and shows "histórico indisponível" for DB charts.
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ available: false });
  }

  const params = request.nextUrl.searchParams;
  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(now.getDate() - 30);
  const from = parseDate(params.get("from"), defaultFrom);
  const to = parseDate(params.get("to"), now);

  try {
    const { getDashboard } = await import("@/lib/erp/dashboardQueries");
    const data = await getDashboard(from, to);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to build dashboard:", error);
    return NextResponse.json({ available: false });
  }
}
