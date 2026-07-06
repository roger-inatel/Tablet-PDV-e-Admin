// Domain model for the Mesa+ restaurant POS (v2 — production alignment).
// Mesa ≠ Comanda ≠ Pedido ≠ ItemPedido; roles/sessions; async fiscal closing.
// Portuguese ubiquitous language (no diacritics in identifiers) — these shapes
// are the contract the future NestJS backend implements (docs/CONTRACTS.md).

export type Category =
  | "Entradas"
  | "Pratos"
  | "Sobremesas"
  | "Bebidas"
  | "Bar";

/** Preparation station (KDS). */
export type Estacao = "cozinha" | "bar";

/** Authenticated role of a session. */
export type Papel = "garcom" | "gerente" | "estacao";

export type GarcomStatus = "ATIVO" | "PAUSA" | "INATIVO";
export type ComandaStatus = "ABERTA" | "EM_FECHAMENTO" | "FECHADA";
export type ItemPedidoStatus = "ENVIADO" | "RECEBIDO" | "EM_PREPARO" | "PRONTO";
export type FiscalStatus = "PROCESSANDO" | "EMITIDA" | "ERRO";
export type MetodoPagamento = "dinheiro" | "cartao" | "pix";

/** A table. Occupancy is DERIVED: comandaId !== null means occupied. */
export interface Mesa {
  id: number;
  num: number;
  seats: number;
  comandaId: string | null;
}

/** Staff member (waiter or manager). */
export interface Garcom {
  id: string;
  name: string;
  initials: string;
  /** Avatar background color (hex). */
  color: string;
  login: string;
  pin: string;
  /** Auth role used by permission logic. */
  papel: "garcom" | "gerente";
  /** Display label ("Garçom", "Garçonete", "Gerente"). */
  cargo: string;
  status: GarcomStatus;
  phone?: string;
  note?: string;
}

/** Menu product. `estacao` defines KDS routing. */
export interface Produto {
  id: string;
  name: string;
  category: Category;
  estacao: Estacao;
  price: number;
}

/** Station configuration (the /admin/setores entity; KDS chrome). */
export interface EstacaoConfig {
  id: Estacao;
  nome: string;
  descricao: string;
  /** Accent color (hex) for KDS chrome / chips. */
  cor: string;
  icone: "flame" | "wine";
  /** Which menu categories route to this station. */
  categorias: Category[];
}

/** Draft line on an open comanda — not yet dispatched (no status field). */
export interface ItemDraft {
  key: string;
  produtoId: string;
  nome: string;
  precoUnit: number;
  estacao: Estacao;
  qtd: number;
}

export interface Pagamento {
  id: string;
  metodo: MetodoPagamento;
  valor: number;
  criadoEm: string; // ISO
}

/** Fiscal emission sub-state (only meaningful after pagamento is created). */
export interface Fiscal {
  status: FiscalStatus;
  tentativas: number;
  erroMsg?: string;
  emitidaEm?: string; // ISO
  /** Mock NFC-e access key. */
  chave?: string;
}

/**
 * The bill of a table. Owns the responsible waiter, the pre-send drafts and
 * the closing lifecycle. `version` bumps on EVERY mutation (optimistic
 * concurrency; sensitive mutations require expectedVersion).
 */
export interface Comanda {
  id: string;
  mesaId: number;
  /** Denormalized for list rendering. */
  mesaNum: number;
  garcomId: string;
  status: ComandaStatus;
  version: number;
  itensDraft: ItemDraft[];
  pagamento: Pagamento | null;
  fiscal: Fiscal | null;
  abertaEm: string; // ISO
  fechadaEm: string | null;
}

/** A line of a dispatched pedido, advanced only by its station's KDS. */
export interface ItemPedido {
  id: string;
  produtoId: string;
  nome: string;
  precoUnit: number;
  estacao: Estacao;
  qtd: number;
  status: ItemPedidoStatus;
  recebidoEm?: string;
  iniciadoEm?: string;
  prontoEm?: string;
}

/** One dispatched batch. May contain items for both stations; KDS filters. */
export interface Pedido {
  id: string;
  comandaId: string;
  /** Denormalized for KDS cards. */
  mesaId: number;
  mesaNum: number;
  garcomId: string;
  /** Sequential within the comanda ("Pedido #2"). */
  seq: number;
  criadoEm: string; // ISO
  itens: ItemPedido[];
}

/** Client session — one per browser tab (persisted in sessionStorage). */
export type Sessao =
  | { papel: "garcom"; garcomId: string }
  | { papel: "gerente"; garcomId: string }
  | { papel: "estacao"; estacao: Estacao };

/** UI layout preferences (persisted). */
export type MesasVariant = "detalhado" | "compacto";
export type ComandaVariant = "dividido" | "foco";

/** Semantic color used by status chips. */
export type ChipKind = "green" | "amber" | "red" | "blue" | "neutral";
