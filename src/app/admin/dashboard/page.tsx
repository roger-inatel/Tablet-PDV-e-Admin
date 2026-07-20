"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { KpiCard } from "@/components/admin/KpiCard";
import { Avatar } from "@/components/ui/Avatar";
import { Loader } from "@/components/ui/Loader";
import { FilterBar } from "@/components/admin/dashboard/FilterBar";
import { SalesChart } from "@/components/admin/dashboard/SalesChart";
import { PaymentPie } from "@/components/admin/dashboard/PaymentPie";
import { Heatmap } from "@/components/admin/dashboard/Heatmap";
import { RankingTable } from "@/components/admin/dashboard/RankingTable";
import { useAppStore } from "@/store/useAppStore";
import { useDashboard } from "@/lib/dashboard/queries";
import {
  liveOperational,
  removalStats,
  waiterRanking,
  type RankRow,
  type WaiterRankRow,
} from "@/lib/dashboard/storeKpis";
import type { DashboardPeriodKey } from "@/lib/dashboard/types";
import type { ProductRank } from "@/lib/dashboard/types";
import { fmt } from "@/lib/format";

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-card border border-line bg-white p-4 ${className}`}>
      <h3 className="m-0 mb-3 text-[1rem] text-navy">{title}</h3>
      {children}
    </div>
  );
}

export default function AdminDashboardPage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const tables = useAppStore((s) => s.tables);
  const checks = useAppStore((s) => s.checks);
  const orders = useAppStore((s) => s.orders);
  const waiters = useAppStore((s) => s.waiters);
  const removals = useAppStore((s) => s.removals);

  const [period, setPeriod] = useState<DashboardPeriodKey>("30d");
  const { data, isFetching, refetch } = useDashboard(period);

  const ops = useMemo(
    () => liveOperational(tables, checks, orders),
    [tables, checks, orders],
  );
  const rem = useMemo(() => removalStats(removals), [removals]);
  const waiterRows = useMemo(
    () => waiterRanking(checks, orders, waiters),
    [checks, orders, waiters],
  );

  const summary = data?.summary;
  const dbAvailable = data?.available === true;

  if (!hydrated) {
    return (
      <>
        <AdminHeader kicker="Gestão" title="Painel gerencial" />
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-8">
          <Loader />
        </div>
      </>
    );
  }

  return (
    <>
      <AdminHeader kicker="Gestão" title="Painel gerencial" />
      <div className="mx-auto grid w-full max-w-[1440px] gap-4 px-4 pb-24 pt-5 md:px-6 lg:px-8">
        <FilterBar
          period={period}
          onChange={setPeriod}
          onRefresh={() => refetch()}
          loading={isFetching}
        />

        {!dbAvailable && (
          <div className="rounded-card border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-[0.88rem] text-[#92400e]">
            Histórico financeiro indisponível (banco de dados não configurado ou sem
            pedidos no período). Os indicadores operacionais ao vivo abaixo seguem
            disponíveis.
          </div>
        )}

        {/* Revenue (DB) */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard
            label="Faturamento · hoje"
            value={fmt(summary?.revenueToday ?? 0)}
            helper="vendas do dia"
            highlight
          />
          <KpiCard
            label="Faturamento · semana"
            value={fmt(summary?.revenueWeek ?? 0)}
            helper="últimos 7 dias"
          />
          <KpiCard
            label="Faturamento · mês"
            value={fmt(summary?.revenueMonth ?? 0)}
            helper="mês corrente"
          />
        </div>

        {/* Financial KPIs (DB, period) + live operational */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Ticket médio"
            value={fmt(summary?.avgTicket ?? 0)}
            helper={`${summary?.orders ?? 0} pedidos no período`}
          />
          <KpiCard
            label="Descontos"
            value={fmt(summary?.discountTotal ?? 0)}
            helper="concedidos no período"
          />
          <KpiCard
            label="Taxa de serviço"
            value={fmt(summary?.serviceFeeTotal ?? 0)}
            helper="arrecadada no período"
          />
          <KpiCard
            label="Mesas ocupadas"
            value={`${ops.occupied}/${ops.tablesTotal}`}
            helper={`${ops.openChecks} comandas abertas`}
          />
        </div>

        {/* Live operational */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Em preparo" value={String(ops.preparing)} helper="itens agora" />
          <KpiCard label="Prontos" value={String(ops.ready)} helper="aguardando entrega" />
          <KpiCard
            label="Em fechamento"
            value={String(ops.inCheckout)}
            helper="aguardando caixa"
          />
          <KpiCard
            label="Remoções pendentes"
            value={String(rem.pending)}
            helper="aguardando aprovação"
            highlight={rem.pending > 0}
          />
        </div>

        {/* Charts */}
        <Card title="Vendas por dia">
          <SalesChart data={data?.salesByDay ?? []} />
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Formas de pagamento">
            <PaymentPie data={data?.payments ?? []} />
          </Card>
          <Card title="Mapa de calor · movimento (dia × horário)">
            <Heatmap data={data?.heatmap ?? []} />
          </Card>
        </div>

        {/* Rankings */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Produtos mais vendidos">
            <RankingTable<ProductRank>
              rows={data?.productRanking ?? []}
              keyOf={(r) => r.productId}
              emptyLabel="Sem vendas no período."
              columns={[
                { header: "Produto", render: (r) => r.name },
                { header: "Qtd", align: "right", render: (r) => r.qty },
                {
                  header: "Faturamento",
                  align: "right",
                  render: (r) => fmt(r.revenue),
                },
              ]}
            />
          </Card>
          <Card title="Ranking de garçons (ativos)">
            <RankingTable<WaiterRankRow>
              rows={waiterRows}
              keyOf={(r) => r.waiterId}
              emptyLabel="Nenhum atendimento ativo."
              columns={[
                {
                  header: "Garçom",
                  render: (r) => (
                    <span className="inline-flex items-center gap-2">
                      <Avatar initials={r.initials} color={r.color} size={22} />
                      {r.name}
                    </span>
                  ),
                },
                { header: "Comandas", align: "right", render: (r) => r.checks },
                {
                  header: "Em aberto",
                  align: "right",
                  render: (r) => fmt(r.outstanding),
                },
              ]}
            />
          </Card>
        </div>

        {/* Removals */}
        <div className="grid gap-3 sm:grid-cols-3">
          <KpiCard
            label="Itens removidos"
            value={String(rem.approved)}
            helper="aprovados (histórico local)"
          />
          <KpiCard
            label="Valor perdido"
            value={fmt(rem.loss)}
            helper="em remoções aprovadas"
          />
          <KpiCard
            label="Remoções pendentes"
            value={String(rem.pending)}
            helper="aguardando decisão"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Itens mais removidos">
            <RankingTable<RankRow>
              rows={rem.byItem}
              keyOf={(r) => r.key}
              emptyLabel="Nenhuma remoção aprovada."
              columns={[
                { header: "Item", render: (r) => r.key },
                { header: "Qtd", align: "right", render: (r) => r.count },
                { header: "Valor", align: "right", render: (r) => fmt(r.loss) },
              ]}
            />
          </Card>
          <Card title="Motivos de remoção">
            <RankingTable<RankRow>
              rows={rem.byReason}
              keyOf={(r) => r.key}
              emptyLabel="Nenhuma remoção aprovada."
              columns={[
                { header: "Motivo", render: (r) => r.key },
                { header: "Ocorrências", align: "right", render: (r) => r.count },
              ]}
            />
          </Card>
        </div>
      </div>
    </>
  );
}
