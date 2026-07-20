import type { Order, RemovalRequest } from "@/types";
import type { RemovalsRepo } from "../types";
import { NotFoundError } from "../errors";
import {
  assertCanDecideRemoval,
  assertCanRequestRemoval,
} from "@/lib/domain/stateMachines";
import { recordRemovalInErp } from "../removalSync";
import { delay, uid } from "@/lib/format";
import { createEvent, getRealtimeClient } from "@/lib/realtime";
import { loadDb, saveDb, type MockDb } from "./database";

// Mutation pattern (mirrors checksRepo): load -> pure transition -> persist ->
// publish realtime event. The removal audit is append-only: nothing is deleted.

function waiterName(db: MockDb, id?: string): string {
  return db.waiters.find((w) => w.id === id)?.name ?? "—";
}

/** Best-effort mirror into the permanent audit table (never blocks the flow). */
function mirror(db: MockDb, r: RemovalRequest): void {
  recordRemovalInErp({
    removalId: r.id,
    checkId: r.checkId,
    tableNum: r.tableNum,
    productId: r.productId,
    itemName: r.itemName,
    qty: r.qty,
    amount: r.amount,
    reason: r.reason,
    status: r.status,
    requestedByWaiterId: r.requestedByWaiterId,
    requestedByName: waiterName(db, r.requestedByWaiterId),
    requestedAt: r.requestedAt,
    decidedByManagerId: r.decidedByManagerId,
    decidedByName: r.decidedByManagerId ? waiterName(db, r.decidedByManagerId) : undefined,
    decidedAt: r.decidedAt,
  }).catch(() => {
    /* audit DB mirror is best-effort; the localStorage record is authoritative in dev */
  });
}

export const removalsRepo: RemovalsRepo = {
  async list() {
    await delay();
    return loadDb().removals;
  },

  async request(orderId, orderItemId, reason, waiterId) {
    await delay();
    const db = loadDb();
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) throw new NotFoundError("Pedido", orderId);
    const item = order.items.find((it) => it.id === orderItemId);
    if (!item) throw new NotFoundError("Item do pedido", orderItemId);
    const check = db.checks.find((c) => c.id === order.checkId);
    if (!check) throw new NotFoundError("Comanda", order.checkId);

    const hasPending = db.removals.some(
      (r) => r.orderItemId === orderItemId && r.status === "PENDING",
    );
    assertCanRequestRemoval(check, item, hasPending);

    const removal: RemovalRequest = {
      id: "rm-" + uid(),
      checkId: check.id,
      tableNum: check.tableNum,
      orderId: order.id,
      orderItemId,
      productId: item.productId,
      itemName: item.name,
      qty: item.qty,
      unitPrice: item.unitPrice,
      amount: item.unitPrice * item.qty,
      reason: reason.trim(),
      status: "PENDING",
      requestedByWaiterId: waiterId,
      requestedAt: new Date().toISOString(),
    };
    saveDb({ ...db, removals: [...db.removals, removal] });
    getRealtimeClient().publish(createEvent("removal.requested", { removal }));
    mirror(db, removal);
    return removal;
  },

  async approve(id, managerId, note) {
    await delay();
    const db = loadDb();
    const removal = db.removals.find((r) => r.id === id);
    if (!removal) throw new NotFoundError("Remoção", id);
    assertCanDecideRemoval(removal);
    const order = db.orders.find((o) => o.id === removal.orderId);
    if (!order) throw new NotFoundError("Pedido", removal.orderId);

    const now = new Date().toISOString();
    const updatedOrder: Order = {
      ...order,
      items: order.items.map((it) =>
        it.id === removal.orderItemId
          ? { ...it, voided: true, voidedAt: now }
          : it,
      ),
    };
    const updatedRemoval: RemovalRequest = {
      ...removal,
      status: "APPROVED",
      decidedByManagerId: managerId,
      decidedAt: now,
      decisionNote: note?.trim() || undefined,
    };
    saveDb({
      ...db,
      orders: db.orders.map((o) => (o.id === order.id ? updatedOrder : o)),
      removals: db.removals.map((r) => (r.id === id ? updatedRemoval : r)),
    });
    getRealtimeClient().publish(
      createEvent("removal.approved", {
        removal: updatedRemoval,
        order: updatedOrder,
      }),
    );
    mirror(db, updatedRemoval);
    return { removal: updatedRemoval, order: updatedOrder };
  },

  async reject(id, managerId, note) {
    await delay();
    const db = loadDb();
    const removal = db.removals.find((r) => r.id === id);
    if (!removal) throw new NotFoundError("Remoção", id);
    assertCanDecideRemoval(removal);

    const updatedRemoval: RemovalRequest = {
      ...removal,
      status: "REJECTED",
      decidedByManagerId: managerId,
      decidedAt: new Date().toISOString(),
      decisionNote: note?.trim() || undefined,
    };
    saveDb({
      ...db,
      removals: db.removals.map((r) => (r.id === id ? updatedRemoval : r)),
    });
    getRealtimeClient().publish(
      createEvent("removal.rejected", { removal: updatedRemoval }),
    );
    mirror(db, updatedRemoval);
    return updatedRemoval;
  },
};
