import type {
  ChipKind,
  Comanda,
  Estacao,
  Garcom,
  GarcomStatus,
  ItemPedidoStatus,
  Mesa,
  Pedido,
  Sessao,
} from "@/types";
import { totalComanda } from "@/lib/domain/pedido";
import { estagioDaEstacao, pertenceAEstacao } from "@/lib/domain/pedido";

// Pure derivations over the v2 store state (call inside useMemo).

export function garconsById(garcons: Garcom[]): Record<string, Garcom> {
  return garcons.reduce(
    (acc, g) => {
      acc[g.id] = g;
      return acc;
    },
    {} as Record<string, Garcom>,
  );
}

export function comandaById(
  comandas: Comanda[],
  id: string | null,
): Comanda | undefined {
  return id ? comandas.find((c) => c.id === id) : undefined;
}

export function pedidosDaComanda(pedidos: Pedido[], comandaId: string): Pedido[] {
  return pedidos
    .filter((p) => p.comandaId === comandaId)
    .sort((a, b) => a.seq - b.seq);
}

// ---- garcom surface ---------------------------------------------------------

export type MesaViewKind = "livre" | "minha" | "outro";

export interface MesaView {
  mesa: Mesa;
  kind: MesaViewKind;
  comanda?: Comanda;
  garcom?: Garcom;
  total: number;
  itemCount: number;
  emFechamento: boolean;
}

export function mesaViews(
  mesas: Mesa[],
  comandas: Comanda[],
  pedidos: Pedido[],
  garcons: Garcom[],
  sessao: Sessao | null,
): MesaView[] {
  const gById = garconsById(garcons);
  const meuId = sessao && sessao.papel !== "estacao" ? sessao.garcomId : null;
  return mesas.map((mesa) => {
    const comanda = comandaById(comandas, mesa.comandaId);
    if (!comanda) {
      return { mesa, kind: "livre", total: 0, itemCount: 0, emFechamento: false };
    }
    const meus = pedidosDaComanda(pedidos, comanda.id);
    const itemCount =
      comanda.itensDraft.reduce((s, d) => s + d.qtd, 0) +
      meus.reduce((s, p) => s + p.itens.reduce((a, i) => a + i.qtd, 0), 0);
    return {
      mesa,
      kind: comanda.garcomId === meuId ? "minha" : "outro",
      comanda,
      garcom: gById[comanda.garcomId],
      total: totalComanda(comanda, meus),
      itemCount,
      emFechamento: comanda.status === "EM_FECHAMENTO",
    };
  });
}

export function minhasMesasCount(views: MesaView[]): number {
  return views.filter((v) => v.kind === "minha").length;
}

// ---- KDS --------------------------------------------------------------------

export interface KdsCard {
  pedido: Pedido;
  /** Least-advanced status among the station's items (board column). */
  estagio: ItemPedidoStatus;
}

/** Station queue: pedidos with items for this station, not fully PRONTO. */
export function kdsQueue(pedidos: Pedido[], estacao: Estacao): KdsCard[] {
  return pedidos
    .filter((p) => pertenceAEstacao(p, estacao))
    .map((p) => ({ pedido: p, estagio: estagioDaEstacao(p, estacao)! }))
    .sort(
      (a, b) =>
        new Date(a.pedido.criadoEm).getTime() -
        new Date(b.pedido.criadoEm).getTime(),
    );
}

// ---- admin ------------------------------------------------------------------

export function comandasAtivas(comandas: Comanda[]): Comanda[] {
  return comandas.filter((c) => c.status !== "FECHADA");
}

export function comandasEmFechamento(comandas: Comanda[]): Comanda[] {
  return comandas.filter((c) => c.status === "EM_FECHAMENTO");
}

export function comandasComErroFiscal(comandas: Comanda[]): Comanda[] {
  return comandas.filter((c) => c.fiscal?.status === "ERRO");
}

export function totalEmAberto(comandas: Comanda[], pedidos: Pedido[]): number {
  return comandasAtivas(comandas).reduce(
    (sum, c) => sum + totalComanda(c, pedidosDaComanda(pedidos, c.id)),
    0,
  );
}

export function garconsAtivos(garcons: Garcom[]): Garcom[] {
  return garcons.filter((g) => g.papel === "garcom" && g.status === "ATIVO");
}

export function mesasDoGarcom(
  comandas: Comanda[],
  garcomId: string,
): number {
  return comandasAtivas(comandas).filter((c) => c.garcomId === garcomId).length;
}

export function garcomStatusMeta(status: GarcomStatus): {
  kind: ChipKind;
  label: string;
} {
  switch (status) {
    case "ATIVO":
      return { kind: "green", label: "Ativo" };
    case "PAUSA":
      return { kind: "amber", label: "Em pausa" };
    default:
      return { kind: "neutral", label: "Inativo" };
  }
}
