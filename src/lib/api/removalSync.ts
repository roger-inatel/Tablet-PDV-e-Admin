import { apiFetch } from "./apiFetch";
import type { RemovalRecordInput } from "@/lib/erp/recordRemocao";

/** Best-effort mirror of a decided removal into the permanent audit table. */
export function recordRemovalInErp(input: RemovalRecordInput): Promise<void> {
  return apiFetch<void>("/api/removals/record", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
