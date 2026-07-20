import { apiFetch } from "./apiFetch";
import type { RecordPedidoInput } from "@/lib/erp/recordPedido";

/** Best-effort sync of a paid check into the real ERP order tables. */
export function recordOrderInErp(input: RecordPedidoInput): Promise<void> {
  return apiFetch<void>("/api/orders/record", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
