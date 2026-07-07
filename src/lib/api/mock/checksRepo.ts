import type { Check, Order } from "@/types";
import type { ChecksRepo } from "../types";
import { InvalidTransitionError, NotFoundError } from "../errors";
import {
  assertCanCancelCheckout,
  assertCanEdit,
  assertCanRegisterPayment,
  assertCanRetryFiscal,
  assertCanStartCheckout,
  assertVersion,
} from "@/lib/domain/stateMachines";
import {
  changeDraftQty,
  chargedTotal,
  draftsToOrderItems,
  mergeDraft,
} from "@/lib/domain/order";
import { PRODUCT_BY_ID } from "@/data/products";
import { delay, uid } from "@/lib/format";
import { createEvent, getRealtimeClient } from "@/lib/realtime";
import { loadDb, saveDb, type MockDb } from "./database";
import { scheduleFiscalIssuance } from "./fiscalService";

// Mutation shape (mirrors the future server): load (read-through) -> pure
// domain transition (throws 409/422) -> persist -> publish realtime event.

function getCheck(db: MockDb, id: string): Check {
  const c = db.checks.find((x) => x.id === id);
  if (!c) throw new NotFoundError("Comanda", id);
  return c;
}

function persistCheck(db: MockDb, check: Check, extra?: Partial<MockDb>): void {
  saveDb({
    ...db,
    ...extra,
    checks: db.checks.map((c) => (c.id === check.id ? check : c)),
  });
}

export const checksRepo: ChecksRepo = {
  async list(filter) {
    await delay();
    const all = loadDb().checks;
    if (!filter?.status?.length) return all;
    return all.filter((c) => filter.status!.includes(c.status));
  },

  async get(id) {
    await delay();
    return loadDb().checks.find((c) => c.id === id) ?? null;
  },

  async open(tableId, waiterId) {
    await delay();
    const db = loadDb();
    const table = db.tables.find((t) => t.id === tableId);
    if (!table) throw new NotFoundError("Mesa", tableId);
    if (table.checkId !== null) {
      throw new InvalidTransitionError("Mesa", "ocupada", "abrir comanda");
    }
    const check: Check = {
      id: "c-" + uid(),
      tableId: table.id,
      tableNum: table.num,
      waiterId,
      status: "OPEN",
      version: 1,
      draftItems: [],
      payment: null,
      fiscal: null,
      openedAt: new Date().toISOString(),
      closedAt: null,
    };
    const occupiedTable = { ...table, checkId: check.id };
    saveDb({
      ...db,
      checks: [...db.checks, check],
      tables: db.tables.map((t) => (t.id === tableId ? occupiedTable : t)),
    });
    getRealtimeClient().publish(
      createEvent("check.opened", { check, table: occupiedTable }),
    );
    return check;
  },

  async addDraftItem(checkId, productId) {
    await delay();
    const db = loadDb();
    const check = getCheck(db, checkId);
    assertCanEdit(check);
    const product = PRODUCT_BY_ID[productId];
    if (!product) throw new NotFoundError("Produto", productId);
    const updated: Check = {
      ...check,
      draftItems: mergeDraft(check.draftItems, product),
      version: check.version + 1,
    };
    persistCheck(db, updated);
    getRealtimeClient().publish(createEvent("check.updated", { check: updated }));
    return updated;
  },

  async setDraftQty(checkId, key, delta) {
    await delay();
    const db = loadDb();
    const check = getCheck(db, checkId);
    assertCanEdit(check);
    const updated: Check = {
      ...check,
      draftItems: changeDraftQty(check.draftItems, key, delta),
      version: check.version + 1,
    };
    persistCheck(db, updated);
    getRealtimeClient().publish(createEvent("check.updated", { check: updated }));
    return updated;
  },

  async sendOrder(checkId, expectedVersion) {
    await delay();
    const db = loadDb();
    const check = getCheck(db, checkId);
    assertVersion(check, expectedVersion);
    assertCanEdit(check);
    if (check.draftItems.length === 0) {
      throw new InvalidTransitionError(
        "Comanda",
        "sem itens no rascunho",
        "enviar pedido",
      );
    }
    const seq = db.orders.filter((o) => o.checkId === checkId).length + 1;
    const order: Order = {
      id: "o-" + uid(),
      checkId,
      tableId: check.tableId,
      tableNum: check.tableNum,
      waiterId: check.waiterId,
      seq,
      createdAt: new Date().toISOString(),
      items: draftsToOrderItems(check.draftItems),
    };
    const updated: Check = {
      ...check,
      draftItems: [],
      version: check.version + 1,
    };
    persistCheck(db, updated, { orders: [...db.orders, order] });
    getRealtimeClient().publish(
      createEvent("order.sent", { order, check: updated }),
    );
    return { check: updated, order };
  },

  async startCheckout(checkId, expectedVersion) {
    await delay();
    const db = loadDb();
    const check = getCheck(db, checkId);
    assertVersion(check, expectedVersion);
    assertCanStartCheckout(check);
    const updated: Check = {
      ...check,
      status: "IN_CHECKOUT",
      version: check.version + 1,
    };
    persistCheck(db, updated);
    getRealtimeClient().publish(
      createEvent("check.checkout_started", { check: updated }),
    );
    return updated;
  },

  async cancelCheckout(checkId) {
    await delay();
    const db = loadDb();
    const check = getCheck(db, checkId);
    assertCanCancelCheckout(check);
    const updated: Check = {
      ...check,
      status: "OPEN",
      version: check.version + 1,
    };
    persistCheck(db, updated);
    getRealtimeClient().publish(createEvent("check.updated", { check: updated }));
    return updated;
  },

  async registerPayment(checkId, method, expectedVersion, opts) {
    await delay();
    const db = loadDb();
    const check = getCheck(db, checkId);
    assertVersion(check, expectedVersion);
    assertCanRegisterPayment(check);
    const amount = chargedTotal(db.orders.filter((o) => o.checkId === checkId));
    const updated: Check = {
      ...check,
      payment: {
        id: "pay-" + uid(),
        method,
        amount,
        createdAt: new Date().toISOString(),
      },
      fiscal: { status: "PROCESSING", attempts: 1 },
      version: check.version + 1,
    };
    persistCheck(db, updated);
    getRealtimeClient().publish(
      createEvent("payment.created", {
        check: updated,
        payment: updated.payment!,
      }),
    );
    // Async fiscal issuance — resolution arrives later as a realtime event.
    scheduleFiscalIssuance(checkId, opts?.simulateFiscalError === true);
    return updated;
  },

  async retryFiscal(checkId) {
    await delay();
    const db = loadDb();
    const check = getCheck(db, checkId);
    assertCanRetryFiscal(check);
    const updated: Check = {
      ...check,
      fiscal: {
        ...check.fiscal!,
        status: "PROCESSING",
        attempts: check.fiscal!.attempts + 1,
        errorMsg: undefined,
      },
      version: check.version + 1,
    };
    persistCheck(db, updated);
    getRealtimeClient().publish(createEvent("check.updated", { check: updated }));
    // Retries always succeed in the mock (deterministic demo).
    scheduleFiscalIssuance(checkId, false);
    return updated;
  },

  async transfer(checkId, waiterId) {
    await delay();
    const db = loadDb();
    const check = getCheck(db, checkId);
    if (!db.waiters.some((w) => w.id === waiterId)) {
      throw new NotFoundError("Garçom", waiterId);
    }
    const updated: Check = {
      ...check,
      waiterId,
      version: check.version + 1,
    };
    persistCheck(db, updated);
    getRealtimeClient().publish(createEvent("check.updated", { check: updated }));
    return updated;
  },
};
