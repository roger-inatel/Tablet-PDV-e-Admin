import type { Check, Table } from "@/types";
import { createEvent, getRealtimeClient } from "@/lib/realtime";
import { loadDb, saveDb } from "./database";

// Async fiscal issuance simulation (the ERP/SEFAZ integration). Mirrors the
// backend behavior: `registerPayment` answers immediately with fiscal
// PROCESSING and the outcome arrives LATER as a realtime event — either
// `check.closed` (ISSUED) or `fiscal.error` (check stays IN_CHECKOUT).

const FISCAL_DELAY_MS = 2500;
// User-facing error message — stays in pt-BR.
const FISCAL_ERROR_MSG = "SEFAZ: timeout na emissão do documento";

export function scheduleFiscalIssuance(
  checkId: string,
  simulateError: boolean,
): void {
  setTimeout(() => process(checkId, simulateError), FISCAL_DELAY_MS);
}

function process(checkId: string, simulateError: boolean): void {
  const db = loadDb();
  const check = db.checks.find((c) => c.id === checkId);
  // The check may have changed while the "server" processed (e.g. another
  // actor). Only conclude an issuance that is still pending.
  if (
    !check ||
    check.status !== "IN_CHECKOUT" ||
    check.fiscal?.status !== "PROCESSING"
  ) {
    return;
  }

  const rt = getRealtimeClient();

  if (simulateError) {
    const updated: Check = {
      ...check,
      fiscal: { ...check.fiscal, status: "ERROR", errorMsg: FISCAL_ERROR_MSG },
      version: check.version + 1,
    };
    saveDb({
      ...db,
      checks: db.checks.map((c) => (c.id === checkId ? updated : c)),
    });
    rt.publish(
      createEvent("fiscal.error", { check: updated, error: FISCAL_ERROR_MSG }),
    );
    return;
  }

  const issuedAt = new Date().toISOString();
  const updated: Check = {
    ...check,
    status: "CLOSED",
    closedAt: issuedAt,
    fiscal: {
      ...check.fiscal,
      status: "ISSUED",
      issuedAt,
      accessKey: `NFCe-${check.tableNum.toString().padStart(2, "0")}-${Date.now().toString(36).toUpperCase()}`,
    },
    version: check.version + 1,
  };
  const currentTable = db.tables.find((t) => t.id === check.tableId);
  const freedTable: Table | undefined = currentTable
    ? { ...currentTable, checkId: null }
    : undefined;

  saveDb({
    ...db,
    checks: db.checks.map((c) => (c.id === checkId ? updated : c)),
    tables: freedTable
      ? db.tables.map((t) => (t.id === freedTable.id ? freedTable : t))
      : db.tables,
  });
  if (freedTable) {
    rt.publish(createEvent("check.closed", { check: updated, table: freedTable }));
  }
}
