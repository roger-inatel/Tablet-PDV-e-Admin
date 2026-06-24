// Domain model for the Mesa+ restaurant POS.
// These types mirror the data shapes from the imported design and are the
// contract shared by the mock data layer, the store and the UI.

export type Sector = "cozinha" | "bar";
export type PrinterSector = Sector | "caixa";

export type WaiterStatus = "ATIVO" | "PAUSA" | "INATIVO";
export type TableStatus = "livre" | "ocupada";
export type ItemStatus = "PENDENTE" | "ENVIADO" | "PREPARO" | "PRONTO";
export type PrinterStatus = "ONLINE" | "OFFLINE";

export type Category =
  | "Entradas"
  | "Pratos"
  | "Sobremesas"
  | "Bebidas"
  | "Bar";

export interface Waiter {
  id: string;
  name: string;
  initials: string;
  /** Avatar background color (hex). */
  color: string;
  login: string;
  pin: string;
  role: string;
  status: WaiterStatus;
  /** Optional contact / notes (mock CRUD fields). */
  phone?: string;
  note?: string;
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  /** Printing sector this product is routed to. */
  sector: Sector;
  price: number;
}

export interface Printer {
  id: string;
  name: string;
  sector: PrinterSector;
  location: string;
  model: string;
  status: PrinterStatus;
}

/** A line on an open comanda (table order). */
export interface ComandaItem {
  /** Stable client-side key. */
  key: string;
  productId: string;
  name: string;
  price: number;
  sector: Sector;
  qty: number;
  status: ItemStatus;
}

export interface Table {
  id: number;
  num: number;
  seats: number;
  status: TableStatus;
  waiterId: string | null;
  items: ComandaItem[];
}

/** UI layout preferences (persisted). */
export type MesasVariant = "detalhado" | "compacto";
export type ComandaVariant = "dividido" | "foco";

/** Semantic color used by status chips. */
export type ChipKind = "green" | "amber" | "red" | "blue" | "neutral";
