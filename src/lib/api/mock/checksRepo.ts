import type {
  Check,
  Order,
  Payment,
  Settlement,
  Table,
  Tender,
} from "@/types";
import type { ChecksRepo } from "../types";
import { InvalidTransitionError, NotFoundError } from "../errors";
import {
  assertCanCancelCheckout,
  assertCanEdit,
  assertCanRegisterPayment,
  assertCanStartCheckout,
  assertVersion,
} from "@/lib/domain/stateMachines";
import {
  activeItems,
  changeDraftQty,
  chargedTotal,
  computeChange,
  draftsToOrderItems,
  mergeDraft,
  setDraftNote,
  settlementTotal,
  tendersPaid,
  validateSettlement,
} from "@/lib/domain/order";
import { productsRepo } from "../productsRepo";
import { recordOrderInErp } from "../erpSync";
import { delay, uid } from "@/lib/format";
import { createEvent, getRealtimeClient } from "@/lib/realtime";
import { loadDb, saveDb, type MockDb } from "./database";

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
    const products = await productsRepo.list();
    const product = products.find((p) => p.id === productId);
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

  async setDraftItemNote(checkId, key, notes) {
    await delay();
    const db = loadDb();
    const check = getCheck(db, checkId);
    assertCanEdit(check);
    const updated: Check = {
      ...check,
      draftItems: setDraftNote(check.draftItems, key, notes),
      version: check.version + 1,
    };
    persistCheck(db, updated);
    getRealtimeClient().publish(createEvent("check.updated", { check: updated }));
    return updated;
  },

  async sendOrder(checkId, expectedVersion, opts) {
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
      priority: opts?.priority ?? "normal",
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

  async registerPayment(checkId, input, expectedVersion) {
    await delay();
    const db = loadDb();
    const check = getCheck(db, checkId);
    assertVersion(check, expectedVersion);
    assertCanRegisterPayment(check);

    const checkOrders = db.orders.filter((o) => o.checkId === checkId);
    const subtotal = chargedTotal(checkOrders);
    const discount = Math.min(Math.max(0, input.discount ?? 0), subtotal);
    const serviceFee = Math.max(0, input.serviceFee ?? 0);
    const total = settlementTotal(subtotal, discount, serviceFee);

    const valid = validateSettlement(total, input.tenders);
    if (!valid.ok) {
      throw new InvalidTransitionError("Pagamento", valid.reason ?? "inválido", "registrar");
    }

    const now = new Date().toISOString();
    const tenders: Tender[] = input.tenders.map((t) => ({
      id: "tnd-" + uid(),
      method: t.method,
      amount: t.amount,
      createdAt: now,
    }));
    // Compat summary: dominant tender drives the single-method label.
    const dominant = tenders.reduce((a, b) => (b.amount > a.amount ? b : a));
    const payment: Payment = {
      id: "pay-" + uid(),
      method: dominant.method,
      amount: total,
      createdAt: now,
    };
    const settlement: Settlement = {
      id: "stl-" + uid(),
      subtotal,
      discount,
      discountKind: input.discountKind,
      discountInput: input.discountInput,
      serviceFee,
      serviceFeeKind: input.serviceFeeKind,
      serviceFeeInput: input.serviceFeeInput,
      total,
      tenders,
      paid: tendersPaid(tenders),
      changeDue: computeChange(total, tenders),
      createdAt: now,
    };

    // Payment closes the check immediately and frees the table.
    const updated: Check = {
      ...check,
      payment,
      settlement,
      status: "CLOSED",
      closedAt: now,
      version: check.version + 1,
    };
    const table = db.tables.find((t) => t.id === check.tableId);
    const freedTable: Table | undefined = table
      ? { ...table, checkId: null }
      : undefined;
    persistCheck(
      db,
      updated,
      freedTable
        ? { tables: db.tables.map((t) => (t.id === freedTable.id ? freedTable : t)) }
        : undefined,
    );
    getRealtimeClient().publish(
      freedTable
        ? createEvent("check.closed", { check: updated, table: freedTable })
        : createEvent("check.updated", { check: updated }),
    );

    // Best-effort sync into the real ERP order tables — never blocks the
    // mock POS flow; failures surface as a toast (see erp.sync_error).
    const waiter = db.waiters.find((w) => w.id === check.waiterId);
    recordOrderInErp({
      checkId,
      tableNum: check.tableNum,
      subtotal,
      discount,
      discountPct: input.discountKind === "percent" ? input.discountInput : undefined,
      serviceFee,
      serviceFeePct:
        input.serviceFeeKind === "percent" ? input.serviceFeeInput : undefined,
      total,
      tenders: input.tenders,
      codVend: waiter?.codVend,
      // Voided items were removed from the check (manager-approved) and are
      // already out of `subtotal` — they must not be invoiced in the ERP.
      items: checkOrders.flatMap((o) =>
        activeItems(o).map((it) => ({
          productId: it.productId,
          qty: it.qty,
          unitPrice: it.unitPrice,
        })),
      ),
    }).catch((e) => {
      getRealtimeClient().publish(
        createEvent("erp.sync_error", {
          checkId,
          message: e instanceof Error ? e.message : "Erro desconhecido",
        }),
      );
    });
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
