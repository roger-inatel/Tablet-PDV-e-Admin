import type { Repos } from "./types";
import { garconsRepo } from "./mock/garconsRepo";
import { produtosRepo } from "./mock/produtosRepo";
import { estacoesRepo } from "./mock/estacoesRepo";
import { mesasRepo } from "./mock/mesasRepo";
import { comandasRepo } from "./mock/comandasRepo";
import { pedidosRepo } from "./mock/pedidosRepo";

// The single place that wires concrete implementations to the repository seam.
// Swapping to the NestJS backend = replace the mock repos with HTTP-backed
// implementations here (fetch + WebSocket/SSE realtime). Every consumer
// imports `repos` and is unaffected by the change. See docs/CONTRACTS.md.
export const repos: Repos = {
  garcons: garconsRepo,
  produtos: produtosRepo,
  estacoes: estacoesRepo,
  mesas: mesasRepo,
  comandas: comandasRepo,
  pedidos: pedidosRepo,
};

export type { Repos } from "./types";
export * from "./errors";
