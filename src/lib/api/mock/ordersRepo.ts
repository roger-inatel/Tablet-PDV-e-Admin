import type { Order, OrderItem } from "@/types";
import type { OrdersRepo } from "../types";
import { InvalidTransitionError, NotFoundError } from "../errors";
import { assertItemTransition } from "@/lib/domain/stateMachines";
import { belongsToStation } from "@/lib/domain/order";
import { delay } from "@/lib/format";
import { createEvent, getRealtimeClient, type RealtimeEventType } from "@/lib/realtime";
import { loadDb, saveDb, type MockDb } from "./database";

function getOrder(db: MockDb, id: string): Order {
  const o = db.orders.find((x) => x.id === id);
  if (!o) throw new NotFoundError("Pedido", id);
  return o;
}

function persistOrder(db: MockDb, order: Order): void {
  saveDb({
    ...db,
    orders: db.orders.map((o) => (o.id === order.id ? order : o)),
  });
}

const EVENT_BY_STATUS: Record<string, RealtimeEventType> = {
  RECEIVED: "order_item.received",
  PREPARING: "order_item.preparing",
  READY: "order_item.ready",
};

function timestampFor(status: OrderItem["status"]): Partial<OrderItem> {
  const now = new Date().toISOString();
  switch (status) {
    case "RECEIVED":
      return { receivedAt: now };
    case "PREPARING":
      return { startedAt: now };
    case "READY":
      return { readyAt: now };
    default:
      return {};
  }
}

export const ordersRepo: OrdersRepo = {
  async list() {
    await delay();
    return loadDb().orders;
  },

  async listByStation(station) {
    await delay();
    return loadDb().orders.filter((o) => belongsToStation(o, station));
  },

  async receive(orderId, station) {
    await delay();
    const db = loadDb();
    const order = getOrder(db, orderId);
    if (!belongsToStation(order, station)) {
      throw new InvalidTransitionError("Pedido", "sem itens da estação", "receber");
    }
    const targets = order.items.filter(
      (it) => it.station === station && it.status === "SENT",
    );
    // Idempotent bulk-ack: nothing pending -> no-op.
    if (targets.length === 0) return order;

    const now = new Date().toISOString();
    const updated: Order = {
      ...order,
      items: order.items.map((it) =>
        it.station === station && it.status === "SENT"
          ? { ...it, status: "RECEIVED", receivedAt: now }
          : it,
      ),
    };
    persistOrder(db, updated);
    const rt = getRealtimeClient();
    targets.forEach((it) => {
      rt.publish(
        createEvent("order_item.received", {
          order: updated,
          itemId: it.id,
          station,
        }),
      );
    });
    return updated;
  },

  async advanceItem(orderId, itemId, to) {
    await delay();
    const db = loadDb();
    const order = getOrder(db, orderId);
    const item = order.items.find((it) => it.id === itemId);
    if (!item) throw new NotFoundError("Item do pedido", itemId);
    assertItemTransition(item.status, to);

    const updated: Order = {
      ...order,
      items: order.items.map((it) =>
        it.id === itemId ? { ...it, status: to, ...timestampFor(to) } : it,
      ),
    };
    persistOrder(db, updated);

    const type = EVENT_BY_STATUS[to];
    if (type) {
      getRealtimeClient().publish(
        createEvent(type as "order_item.received", {
          order: updated,
          itemId,
          station: item.station,
        }),
      );
    }
    return updated;
  },
};
