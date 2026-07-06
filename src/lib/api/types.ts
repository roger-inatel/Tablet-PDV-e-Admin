import type {
  Category,
  Comanda,
  ComandaStatus,
  Estacao,
  EstacaoConfig,
  Garcom,
  ItemPedidoStatus,
  Mesa,
  MetodoPagamento,
  Pedido,
  Produto,
} from "@/types";

// ---------------------------------------------------------------------------
// The repository seam (v2). Each method maps 1:1 to a future NestJS endpoint —
// see docs/CONTRACTS.md. Mutations return updated aggregates; sensitive
// comanda mutations take `expectedVersion` and throw ConflictError(409) on
// mismatch. Permissions are NOT repo parameters (the backend derives the
// actor from the auth token); the frontend enforces them in store/UI via
// lib/domain/permissions.ts, and the mock repos enforce only state-machine
// invariants (lib/domain/maquinas.ts).
// ---------------------------------------------------------------------------

export interface GarconsRepo {
  list(): Promise<Garcom[]>;
  /** Returns the garcom when the PIN matches, otherwise null. -> POST /auth/login */
  authenticate(garcomId: string, pin: string): Promise<Garcom | null>;
  /** Upsert (create when the id is new). -> PUT /garcons/:id */
  save(garcom: Garcom): Promise<Garcom>;
}

export interface ProdutosRepo {
  list(): Promise<Produto[]>;
  categories(): Promise<Category[]>;
}

export interface EstacoesRepo {
  list(): Promise<EstacaoConfig[]>;
}

export interface MesasRepo {
  /** Mesas mutate only through comandas (abrir/fechar). */
  list(): Promise<Mesa[]>;
}

export interface ComandasRepo {
  list(filtro?: { status?: ComandaStatus[] }): Promise<Comanda[]>;
  get(id: string): Promise<Comanda | null>;
  /** Claim a free mesa. -> POST /mesas/:id/comandas */
  abrir(mesaId: number, garcomId: string): Promise<Comanda>;
  /** Draft edits (no expectedVersion — drafts are low-stakes). */
  addItemDraft(comandaId: string, produtoId: string): Promise<Comanda>;
  setQtdDraft(comandaId: string, key: string, delta: 1 | -1): Promise<Comanda>;
  /** Dispatch all drafts as one pedido. -> POST /comandas/:id/pedidos */
  enviarPedido(
    comandaId: string,
    expectedVersion: number,
  ): Promise<{ comanda: Comanda; pedido: Pedido }>;
  /** ABERTA -> EM_FECHAMENTO. -> POST /comandas/:id/fechamento */
  iniciarFechamento(comandaId: string, expectedVersion: number): Promise<Comanda>;
  /** EM_FECHAMENTO -> ABERTA (only while pagamento === null). */
  cancelarFechamento(comandaId: string): Promise<Comanda>;
  /** Creates pagamento + starts async fiscal emission. `simularErroFiscal` is mock-only. */
  registrarPagamento(
    comandaId: string,
    metodo: MetodoPagamento,
    expectedVersion: number,
    opts?: { simularErroFiscal?: boolean },
  ): Promise<Comanda>;
  /** Re-run fiscal emission after ERRO. -> POST /comandas/:id/fiscal/retry */
  retryFiscal(comandaId: string): Promise<Comanda>;
  /** Reassign the responsible waiter (gerente). -> PATCH /comandas/:id/garcom */
  transferir(comandaId: string, garcomId: string): Promise<Comanda>;
}

export interface PedidosRepo {
  list(): Promise<Pedido[]>;
  listByEstacao(estacao: Estacao): Promise<Pedido[]>;
  /** Bulk-ack: every ENVIADO item of the station -> RECEBIDO. */
  receber(pedidoId: string, estacao: Estacao): Promise<Pedido>;
  /** Advance one item to the next linear status (422 otherwise). */
  avancarItem(
    pedidoId: string,
    itemId: string,
    para: ItemPedidoStatus,
  ): Promise<Pedido>;
}

export interface Repos {
  garcons: GarconsRepo;
  produtos: ProdutosRepo;
  estacoes: EstacoesRepo;
  mesas: MesasRepo;
  comandas: ComandasRepo;
  pedidos: PedidosRepo;
}
