import type {
  Comanda,
  Estacao,
  Mesa,
  Pagamento,
  Pedido,
} from "@/types";

// Typed realtime event contract. This union IS the contract the future
// NestJS backend emits over WebSocket/SSE — see docs/CONTRACTS.md.
//
// Payloads carry FULL aggregate snapshots (comanda includes `version`), so
// reconciliation is a version-guarded upsert: idempotent and order-tolerant.

export interface EventoEnvelope<T extends string, P> {
  /** Unique event id. */
  id: string;
  tipo: T;
  /** ISO timestamp of emission. */
  ts: string;
  /** Client/node that published (debugging; NOT used to skip echo). */
  origem: string;
  payload: P;
}

export type EventoRealtime =
  | EventoEnvelope<"comanda.aberta", { comanda: Comanda; mesa: Mesa }>
  | EventoEnvelope<"comanda.atualizada", { comanda: Comanda }>
  | EventoEnvelope<"pedido.enviado", { pedido: Pedido; comanda: Comanda }>
  | EventoEnvelope<"item.recebido", { pedido: Pedido; itemId: string; estacao: Estacao }>
  | EventoEnvelope<"item.em_preparo", { pedido: Pedido; itemId: string; estacao: Estacao }>
  | EventoEnvelope<"item.pronto", { pedido: Pedido; itemId: string; estacao: Estacao }>
  | EventoEnvelope<"comanda.fechamento_iniciado", { comanda: Comanda }>
  | EventoEnvelope<"pagamento.criado", { comanda: Comanda; pagamento: Pagamento }>
  | EventoEnvelope<"fiscal.erro", { comanda: Comanda; erro: string }>
  | EventoEnvelope<"comanda.fechada", { comanda: Comanda; mesa: Mesa }>;

export type EventoTipo = EventoRealtime["tipo"];

/** Payload type for a given event tipo. */
export type PayloadDe<T extends EventoTipo> = Extract<
  EventoRealtime,
  { tipo: T }
>["payload"];

export interface RealtimeClient {
  /** Stable id of this tab/connection (debugging only). */
  readonly clientId: string;
  publish(evento: EventoRealtime): void;
  /** Returns an unsubscribe function. */
  subscribe(handler: (evento: EventoRealtime) => void): () => void;
}
