import { uid } from "@/lib/format";
import type {
  PayloadOf,
  RealtimeClient,
  RealtimeEvent,
  RealtimeEventType,
} from "./types";

// Mock realtime transport over BroadcastChannel: cross-tab events with zero
// backend. Swapping to the real NestJS gateway later = implement
// RealtimeClient over WebSocket/SSE; nothing else changes.

const CHANNEL_NAME = "mesaplus.rt.v3";

type Handler = (event: RealtimeEvent) => void;

class BroadcastRealtimeClient implements RealtimeClient {
  readonly clientId = uid();
  private channel: BroadcastChannel | null = null;
  private handlers = new Set<Handler>();

  /** Lazy, client-only — never instantiated during SSR. */
  private ensureChannel(): void {
    if (this.channel !== null || typeof window === "undefined") return;
    this.channel = new BroadcastChannel(CHANNEL_NAME);
    this.channel.onmessage = (e: MessageEvent<RealtimeEvent>) =>
      this.dispatch(e.data);
  }

  private dispatch(event: RealtimeEvent): void {
    this.handlers.forEach((h) => h(event));
  }

  publish(event: RealtimeEvent): void {
    this.ensureChannel();
    this.channel?.postMessage(event);
    // LOCAL ECHO — deliberate. BroadcastChannel excludes the sender tab, so we
    // loop the event back to our own subscribers. Combined with the store's
    // `version >` guard this is what lets server-initiated updates (the async
    // fiscal timer) reach the tab that triggered them. Do NOT "simplify" this
    // into skip-when-origin-is-mine: that would break the fiscal flow.
    this.dispatch(event);
  }

  subscribe(handler: Handler): () => void {
    this.ensureChannel();
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }
}

let singleton: BroadcastRealtimeClient | null = null;

export function getRealtimeClient(): RealtimeClient {
  if (singleton === null) singleton = new BroadcastRealtimeClient();
  return singleton;
}

/** Type-safe envelope builder used by the mock repos. */
export function createEvent<T extends RealtimeEventType>(
  type: T,
  payload: PayloadOf<T>,
): RealtimeEvent {
  return {
    id: uid(),
    type,
    ts: new Date().toISOString(),
    origin: getRealtimeClient().clientId,
    payload,
  } as RealtimeEvent;
}
