import { apiFetch } from "./apiFetch";
import type { PedidoItemInput } from "@/lib/erp/recordPedido";
import type { PaymentMethod } from "@/types";

interface RecordOrderInput {
  checkId: string;
  tableNum: number;
  method: PaymentMethod;
  items: PedidoItemInput[];
  amount: number;
}

/** Best-effort sync of a paid check into the real ERP order tables. */
export function recordOrderInErp(input: RecordOrderInput): Promise<void> {
  return apiFetch<void>("/api/orders/record", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
