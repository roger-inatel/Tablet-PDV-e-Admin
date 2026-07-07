import type {
  Check,
  Order,
  Payment,
  Station,
  Table,
} from "@/types";

// Typed realtime event contract. This union IS the contract the NestJS
// backend emits over WebSocket/SSE — see docs/CONTRACTS.md.
//
// Payloads carry FULL aggregate snapshots (check includes `version`), so
// reconciliation is a version-guarded upsert: idempotent and order-tolerant.

export interface EventEnvelope<T extends string, P> {
  /** Unique event id. */
  id: string;
  type: T;
  /** ISO timestamp of emission. */
  ts: string;
  /** Client/node that published (debugging; NOT used to skip echo). */
  origin: string;
  payload: P;
}

export type RealtimeEvent =
  | EventEnvelope<"check.opened", { check: Check; table: Table }>
  | EventEnvelope<"check.updated", { check: Check }>
  | EventEnvelope<"order.sent", { order: Order; check: Check }>
  | EventEnvelope<"order_item.received", { order: Order; itemId: string; station: Station }>
  | EventEnvelope<"order_item.preparing", { order: Order; itemId: string; station: Station }>
  | EventEnvelope<"order_item.ready", { order: Order; itemId: string; station: Station }>
  | EventEnvelope<"check.checkout_started", { check: Check }>
  | EventEnvelope<"payment.created", { check: Check; payment: Payment }>
  | EventEnvelope<"fiscal.error", { check: Check; error: string }>
  | EventEnvelope<"check.closed", { check: Check; table: Table }>;

export type RealtimeEventType = RealtimeEvent["type"];

/** Payload type for a given event type. */
export type PayloadOf<T extends RealtimeEventType> = Extract<
  RealtimeEvent,
  { type: T }
>["payload"];

export interface RealtimeClient {
  /** Stable id of this tab/connection (debugging only). */
  readonly clientId: string;
  publish(event: RealtimeEvent): void;
  /** Returns an unsubscribe function. */
  subscribe(handler: (event: RealtimeEvent) => void): () => void;
}
