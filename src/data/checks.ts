import type { Check, DraftItem } from "@/types";
import { PRODUCT_BY_ID } from "./products";

/** ISO timestamp n minutes before "now" (computed once at db init). */
export type MinutesAgo = (n: number) => string;

function draft(key: string, productId: string, qty: number): DraftItem {
  const p = PRODUCT_BY_ID[productId];
  return {
    key,
    productId,
    name: p.name,
    unitPrice: p.price,
    station: p.station,
    qty,
  };
}

// Demo-rich check seed. Versions > 1 make optimistic-concurrency demos
// realistic. Kept in sync with data/tables.ts and data/orders.ts.
export function seedChecks(minutesAgo: MinutesAgo): Check[] {
  return [
    {
      // Table 2 — multi-order, both stations in flight.
      id: "c-t2",
      tableId: 2,
      tableNum: 2,
      waiterId: "carlos",
      status: "OPEN",
      version: 4,
      draftItems: [],
      payment: null,
      fiscal: null,
      openedAt: minutesAgo(55),
      closedAt: null,
    },
    {
      // Table 3 — freshly dispatched order (KDS kitchen highlight).
      id: "c-t3",
      tableId: 3,
      tableNum: 3,
      waiterId: "marina",
      status: "OPEN",
      version: 2,
      draftItems: [],
      payment: null,
      fiscal: null,
      openedAt: minutesAgo(12),
      closedAt: null,
    },
    {
      // Table 4 — drafts only (pre-send stage).
      id: "c-t4",
      tableId: 4,
      tableNum: 4,
      waiterId: "carlos",
      status: "OPEN",
      version: 1,
      draftItems: [draft("d-t4-1", "pr5", 1), draft("d-t4-2", "pr17", 1)],
      payment: null,
      fiscal: null,
      openedAt: minutesAgo(6),
      closedAt: null,
    },
    {
      // Table 6 — one order spanning both stations, in preparation.
      id: "c-t6",
      tableId: 6,
      tableNum: 6,
      waiterId: "bruno",
      status: "OPEN",
      version: 3,
      draftItems: [],
      payment: null,
      fiscal: null,
      openedAt: minutesAgo(34),
      closedAt: null,
    },
    {
      // Table 7 — bar order dispatched + a pending draft.
      id: "c-t7",
      tableId: 7,
      tableNum: 7,
      waiterId: "carlos",
      status: "OPEN",
      version: 3,
      draftItems: [draft("d-t7-1", "pr2", 1)],
      payment: null,
      fiscal: null,
      openedAt: minutesAgo(25),
      closedAt: null,
    },
    {
      // Table 8 — checkout started, awaiting payment.
      id: "c-t8",
      tableId: 8,
      tableNum: 8,
      waiterId: "marina",
      status: "IN_CHECKOUT",
      version: 5,
      draftItems: [],
      payment: null,
      fiscal: null,
      openedAt: minutesAgo(78),
      closedAt: null,
    },
    {
      // Table 10 — bar queue.
      id: "c-t10",
      tableId: 10,
      tableNum: 10,
      waiterId: "julia",
      status: "OPEN",
      version: 2,
      draftItems: [],
      payment: null,
      fiscal: null,
      openedAt: minutesAgo(18),
      closedAt: null,
    },
    {
      // Table 11 — paid, fiscal issuance FAILED (retry demo on /admin/checks).
      id: "c-t11",
      tableId: 11,
      tableNum: 11,
      waiterId: "carlos",
      status: "IN_CHECKOUT",
      version: 6,
      payment: {
        id: "pay-t11",
        method: "card",
        amount: 230,
        createdAt: minutesAgo(9),
      },
      fiscal: {
        status: "ERROR",
        attempts: 1,
        errorMsg: "SEFAZ: timeout na emissão do documento",
      },
      draftItems: [],
      openedAt: minutesAgo(96),
      closedAt: null,
    },
    {
      // Historic closed check (table 5's earlier service) for /admin/checks.
      id: "c-hist1",
      tableId: 5,
      tableNum: 5,
      waiterId: "marina",
      status: "CLOSED",
      version: 7,
      draftItems: [],
      payment: {
        id: "pay-hist1",
        method: "pix",
        amount: 40,
        createdAt: minutesAgo(64),
      },
      fiscal: {
        status: "ISSUED",
        attempts: 1,
        issuedAt: minutesAgo(63),
        accessKey: "NFCe-3526-0707-0001-DEMO",
      },
      openedAt: minutesAgo(110),
      closedAt: minutesAgo(63),
    },
  ];
}
