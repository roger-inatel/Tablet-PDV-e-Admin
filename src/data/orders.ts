import type { Order, OrderItem, OrderItemStatus } from "@/types";
import { PRODUCT_BY_ID } from "./products";
import type { MinutesAgo } from "./checks";

interface ItemTimes {
  receivedAt?: string;
  startedAt?: string;
  readyAt?: string;
}

function item(
  orderId: string,
  n: number,
  productId: string,
  qty: number,
  status: OrderItemStatus,
  times: ItemTimes = {},
): OrderItem {
  const p = PRODUCT_BY_ID[productId];
  return {
    id: `${orderId}-i${n}`,
    productId,
    name: p.name,
    unitPrice: p.price,
    station: p.station,
    qty,
    status,
    ...times,
  };
}

// Dispatched orders seed — in sync with data/checks.ts scenarios.
export function seedOrders(minutesAgo: MinutesAgo): Order[] {
  return [
    // Table 2 · Order #1 — mixed stations, mostly done.
    {
      id: "o-t2-1",
      checkId: "c-t2",
      tableId: 2,
      tableNum: 2,
      waiterId: "carlos",
      seq: 1,
      createdAt: minutesAgo(48),
      items: [
        item("o-t2-1", 1, "pr0", 2, "READY", {
          receivedAt: minutesAgo(47),
          startedAt: minutesAgo(44),
          readyAt: minutesAgo(38),
        }),
        item("o-t2-1", 2, "pr6", 1, "PREPARING", {
          receivedAt: minutesAgo(47),
          startedAt: minutesAgo(40),
        }),
        item("o-t2-1", 3, "pr16", 2, "READY", {
          receivedAt: minutesAgo(47),
          startedAt: minutesAgo(46),
          readyAt: minutesAgo(45),
        }),
      ],
    },
    // Table 2 · Order #2 — kitchen acknowledged.
    {
      id: "o-t2-2",
      checkId: "c-t2",
      tableId: 2,
      tableNum: 2,
      waiterId: "carlos",
      seq: 2,
      createdAt: minutesAgo(10),
      items: [
        item("o-t2-2", 1, "pr8", 1, "RECEIVED", {
          receivedAt: minutesAgo(8),
        }),
      ],
    },
    // Table 3 · Order #1 — just dispatched (KDS kitchen "new" highlight).
    {
      id: "o-t3-1",
      checkId: "c-t3",
      tableId: 3,
      tableNum: 3,
      waiterId: "marina",
      seq: 1,
      createdAt: minutesAgo(2),
      items: [item("o-t3-1", 1, "pr4", 1, "SENT")],
    },
    // Table 6 · Order #1 — both stations preparing.
    {
      id: "o-t6-1",
      checkId: "c-t6",
      tableId: 6,
      tableNum: 6,
      waiterId: "bruno",
      seq: 1,
      createdAt: minutesAgo(28),
      items: [
        item("o-t6-1", 1, "pr7", 1, "PREPARING", {
          receivedAt: minutesAgo(27),
          startedAt: minutesAgo(24),
        }),
        item("o-t6-1", 2, "pr12", 2, "PREPARING", {
          receivedAt: minutesAgo(27),
          startedAt: minutesAgo(26),
        }),
      ],
    },
    // Table 7 · Order #1 — bar, still unseen by the KDS.
    {
      id: "o-t7-1",
      checkId: "c-t7",
      tableId: 7,
      tableNum: 7,
      waiterId: "carlos",
      seq: 1,
      createdAt: minutesAgo(4),
      items: [item("o-t7-1", 1, "pr18", 2, "SENT")],
    },
    // Table 8 · Order #1 — everything ready (checkout in progress).
    {
      id: "o-t8-1",
      checkId: "c-t8",
      tableId: 8,
      tableNum: 8,
      waiterId: "marina",
      seq: 1,
      createdAt: minutesAgo(70),
      items: [
        item("o-t8-1", 1, "pr3", 1, "READY", {
          receivedAt: minutesAgo(69),
          startedAt: minutesAgo(66),
          readyAt: minutesAgo(52),
        }),
        item("o-t8-1", 2, "pr19", 2, "READY", {
          receivedAt: minutesAgo(69),
          startedAt: minutesAgo(68),
          readyAt: minutesAgo(65),
        }),
      ],
    },
    // Table 10 · Order #1 — bar acknowledged.
    {
      id: "o-t10-1",
      checkId: "c-t10",
      tableId: 10,
      tableNum: 10,
      waiterId: "julia",
      seq: 1,
      createdAt: minutesAgo(15),
      items: [
        item("o-t10-1", 1, "pr16", 2, "RECEIVED", {
          receivedAt: minutesAgo(13),
        }),
      ],
    },
    // Table 11 · Orders #1 and #2 — all ready; check stuck on fiscal ERROR.
    {
      id: "o-t11-1",
      checkId: "c-t11",
      tableId: 11,
      tableNum: 11,
      waiterId: "carlos",
      seq: 1,
      createdAt: minutesAgo(80),
      items: [
        item("o-t11-1", 1, "pr6", 2, "READY", {
          receivedAt: minutesAgo(79),
          startedAt: minutesAgo(74),
          readyAt: minutesAgo(58),
        }),
        item("o-t11-1", 2, "pr13", 2, "READY", {
          receivedAt: minutesAgo(79),
          startedAt: minutesAgo(78),
          readyAt: minutesAgo(76),
        }),
      ],
    },
    {
      id: "o-t11-2",
      checkId: "c-t11",
      tableId: 11,
      tableNum: 11,
      waiterId: "carlos",
      seq: 2,
      createdAt: minutesAgo(40),
      items: [
        item("o-t11-2", 1, "pr9", 2, "READY", {
          receivedAt: minutesAgo(39),
          startedAt: minutesAgo(36),
          readyAt: minutesAgo(30),
        }),
      ],
    },
    // Historic closed check (table 5).
    {
      id: "o-hist1-1",
      checkId: "c-hist1",
      tableId: 5,
      tableNum: 5,
      waiterId: "marina",
      seq: 1,
      createdAt: minutesAgo(100),
      items: [
        item("o-hist1-1", 1, "pr10", 1, "READY", {
          receivedAt: minutesAgo(99),
          startedAt: minutesAgo(95),
          readyAt: minutesAgo(88),
        }),
        item("o-hist1-1", 2, "pr12", 1, "READY", {
          receivedAt: minutesAgo(99),
          startedAt: minutesAgo(98),
          readyAt: minutesAgo(96),
        }),
      ],
    },
  ];
}
