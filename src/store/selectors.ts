import type { ChipKind, Table, Waiter } from "@/types";
import { total } from "@/lib/domain/comanda";

// Pure derivations over store state. Components call these inside `useMemo`
// (rather than subscribing to a freshly-built object each render).

export function waitersById(waiters: Waiter[]): Record<string, Waiter> {
  return waiters.reduce(
    (acc, w) => {
      acc[w.id] = w;
      return acc;
    },
    {} as Record<string, Waiter>,
  );
}

export function occupiedTables(tables: Table[]): Table[] {
  return tables.filter((t) => t.status === "ocupada");
}

export function freeTables(tables: Table[]): Table[] {
  return tables.filter((t) => t.status === "livre");
}

/** Occupied tables that already have at least one item (an open comanda). */
export function openComandas(tables: Table[]): Table[] {
  return occupiedTables(tables).filter((t) => t.items.length > 0);
}

export function activeWaiters(waiters: Waiter[]): Waiter[] {
  return waiters.filter((w) => w.status === "ATIVO");
}

/** Tables an open comanda total across all occupied tables. */
export function openTotal(tables: Table[]): number {
  return occupiedTables(tables).reduce((sum, t) => sum + total(t.items), 0);
}

export function tablesForWaiter(tables: Table[], waiterId: string | null): Table[] {
  if (!waiterId) return [];
  return tables.filter((t) => t.status === "ocupada" && t.waiterId === waiterId);
}

export function tableCountForWaiter(tables: Table[], waiterId: string): number {
  return tables.filter((t) => t.waiterId === waiterId).length;
}

/** Status of a comanda row on the admin dashboard. */
export function comandaRowStatus(t: Table): { kind: ChipKind; label: string } {
  const hasPending = t.items.some((i) => i.status === "PENDENTE");
  const allReady = t.items.length > 0 && t.items.every((i) => i.status === "PRONTO");
  if (hasPending) return { kind: "neutral", label: "Itens a enviar" };
  if (allReady) return { kind: "green", label: "Tudo pronto" };
  return { kind: "blue", label: "Em andamento" };
}

/** Waiter status chip mapping. */
export function waiterStatusMeta(status: Waiter["status"]): {
  kind: ChipKind;
  label: string;
} {
  switch (status) {
    case "ATIVO":
      return { kind: "green", label: "Ativo" };
    case "PAUSA":
      return { kind: "amber", label: "Em pausa" };
    default:
      return { kind: "neutral", label: "Inativo" };
  }
}
