# Mesa+ — Contratos Frontend ⇄ Backend (v2)

> **Status: v2 implementado no frontend (mock).** Este documento é o espelho dos
> contratos que o frontend implementa hoje e que o backend NestJS deve honrar.
> Fontes de verdade no código: `src/types/index.ts` (modelo),
> `src/lib/api/types.ts` (repos), `src/lib/realtime/types.ts` (eventos),
> `src/lib/domain/maquinas.ts` (máquinas de estado),
> `src/lib/domain/permissions.ts` (regras por papel).

## 1. Modelo de domínio

- **Mesa** `{ id, num, seats, comandaId|null }` — ocupação é derivada de `comandaId`.
- **Garcom** `{ id, name, initials, color, login, pin, papel: 'garcom'|'gerente', cargo, status, phone?, note? }`.
- **Produto** `{ id, name, category, estacao: 'cozinha'|'bar', price }` — `estacao` define o roteamento KDS.
- **EstacaoConfig** `{ id, nome, descricao, cor, icone, categorias[] }`.
- **Comanda** `{ id, mesaId, mesaNum, garcomId, status, version, itensDraft[], pagamento|null, fiscal|null, abertaEm, fechadaEm|null }`.
- **ItemDraft** `{ key, produtoId, nome, precoUnit, estacao, qtd }` — estágio pré-envio, sem status.
- **Pedido** `{ id, comandaId, mesaId, mesaNum, garcomId, seq, criadoEm, itens: ItemPedido[] }` — um lote enviado; pode conter as duas estações.
- **ItemPedido** `{ id, produtoId, nome, precoUnit, estacao, qtd, status, recebidoEm?, iniciadoEm?, prontoEm? }`.
- **Sessao** `{ papel:'garcom'|'gerente', garcomId } | { papel:'estacao', estacao }` — estado de cliente; backend usa token (JWT/cookie).

**Regra de dinheiro:** total exibido = drafts + itens de pedidos; total **cobrado** no fechamento = apenas itens de pedidos. `iniciarFechamento` é rejeitado com drafts pendentes.

## 2. Máquinas de estado

```
Comanda:   ABERTA ──iniciarFechamento──▶ EM_FECHAMENTO ──fiscal EMITIDA──▶ FECHADA
              ▲                              │
              └────────cancelarFechamento────┘  (somente enquanto pagamento === null)

Fiscal:    (null) ──pagamento.criado──▶ PROCESSANDO ──▶ EMITIDA  (terminal → Comanda FECHADA, mesa livre)
                                             │──▶ ERRO ──retry──▶ PROCESSANDO (tentativas++)

ItemPedido: ENVIADO ─receber─▶ RECEBIDO ─iniciar─▶ EM_PREPARO ─pronto─▶ PRONTO  (estritamente linear)
```

Guards adicionais: editar/enviar exigem `ABERTA`; `iniciarFechamento` exige `itensDraft.length === 0`; `registrarPagamento` exige `EM_FECHAMENTO && !pagamento`; `retryFiscal` exige `fiscal.status === 'ERRO'`.

## 3. Versionamento (concorrência otimista)

- **Toda** mutação de comanda incrementa `version`.
- `enviarPedido`, `iniciarFechamento` e `registrarPagamento` exigem `expectedVersion` (equivalente a `If-Match`); divergência → **409 Conflict**.
- Edições de draft e transições de item de pedido não carregam versão (a própria transição linear é o CAS do item).
- UX no front: 409 → refetch da comanda → toast "Comanda atualizada por outro usuário" → modal permanece aberto com dados atualizados (sem retry silencioso).

## 4. Endpoints (repo ⇄ REST) — papel exigido e erros

| Método do repo | Rota REST (NestJS) | Papel | Erros |
|---|---|---|---|
| `garcons.list()` | `GET /garcons` | gerente (admin) / autenticado | — |
| `garcons.authenticate(id, pin)` | `POST /auth/login` | público | 401 |
| `garcons.save(g)` | `PUT /garcons/:id` | gerente | 404 |
| `produtos.list()` | `GET /produtos` | autenticado | — |
| `produtos.categories()` | `GET /produtos/categorias` | autenticado | — |
| `estacoes.list()` | `GET /estacoes` | autenticado | — |
| `mesas.list()` | `GET /mesas` | garcom, gerente | — |
| `comandas.list(filtro?)` | `GET /comandas?status=` | garcom (leitura), gerente | — |
| `comandas.get(id)` | `GET /comandas/:id` | garcom (leitura), gerente | 404 |
| `comandas.abrir(mesaId, garcomId)` | `POST /mesas/:id/comandas` | garcom | 404, 422 (mesa ocupada) |
| `comandas.addItemDraft(id, produtoId)` | `POST /comandas/:id/itens` | garcom responsável | 403, 404, 422 |
| `comandas.setQtdDraft(id, key, delta)` | `PATCH /comandas/:id/itens/:key` | garcom responsável | 403, 404, 422 |
| `comandas.enviarPedido(id, expectedVersion)` | `POST /comandas/:id/pedidos` | garcom responsável | 403, 409, 422 |
| `comandas.iniciarFechamento(id, expectedVersion)` | `POST /comandas/:id/fechamento` | responsável OU gerente | 403, 409, 422 (drafts pendentes) |
| `comandas.cancelarFechamento(id)` | `DELETE /comandas/:id/fechamento` | responsável OU gerente | 403, 422 (já pago) |
| `comandas.registrarPagamento(id, metodo, expectedVersion)` | `POST /comandas/:id/pagamentos` | responsável OU gerente | 403, 409, 422 |
| `comandas.retryFiscal(id)` | `POST /comandas/:id/fiscal/retry` | gerente | 403, 422 |
| `comandas.transferir(id, garcomId)` | `PATCH /comandas/:id/garcom` | gerente | 403, 404 |
| `pedidos.list()` | `GET /pedidos` | gerente | — |
| `pedidos.listByEstacao(estacao)` | `GET /estacoes/:estacao/pedidos` | estacao correspondente | 403 |
| `pedidos.receber(pedidoId, estacao)` | `POST /pedidos/:id/receber` | estacao (itens da própria estação) | 403, 422 |
| `pedidos.avancarItem(pedidoId, itemId, para)` | `POST /pedidos/:id/itens/:itemId/transicao` | estacao do item | 403, 404, 422 |

Códigos: `409 ConflictError` (versão), `403 ForbiddenError`, `422 InvalidTransitionError`, `404 NotFoundError` — ver `src/lib/api/errors.ts`.

## 5. Eventos em tempo real (WebSocket/SSE)

Envelope: `{ id, tipo, ts, origem, payload }`. Payloads carregam **snapshots completos** (comanda com `version`); o cliente aplica upsert guardado por `version >` — idempotente e tolerante a reordenação.

| Evento | Payload | Emitido quando |
|---|---|---|
| `comanda.aberta` | `{ comanda, mesa }` | garçom assume mesa livre |
| `comanda.atualizada` | `{ comanda }` | edição de drafts / transferência |
| `pedido.enviado` | `{ pedido, comanda }` | envio de drafts como pedido |
| `item.recebido` | `{ pedido, itemId, estacao }` | KDS confirma recebimento |
| `item.em_preparo` | `{ pedido, itemId, estacao }` | KDS inicia preparo |
| `item.pronto` | `{ pedido, itemId, estacao }` | KDS marca pronto |
| `comanda.fechamento_iniciado` | `{ comanda }` | fechamento iniciado |
| `pagamento.criado` | `{ comanda, pagamento }` | pagamento registrado |
| `fiscal.erro` | `{ comanda, erro }` | emissão fiscal falhou |
| `comanda.fechada` | `{ comanda, mesa }` | fiscal emitida; mesa liberada |

Recuperação de eventos perdidos: o cliente refaz `refresh()` (refetch geral) ao voltar a ficar visível (`visibilitychange`). O backend não precisa de replay/event-log para o v1 do contrato.

## 6. Regras por papel (resumo — código em `permissions.ts`)

- **garcom**: vê todas as mesas e pode abrir comanda de mesa livre; consulta comanda de outro garçom **somente leitura**; lança/edita drafts, envia pedido e fecha **apenas a própria** comanda.
- **gerente**: tudo de leitura + fechar/pagar comandas pelo painel (caixa), retry fiscal, transferir responsável.
- **estacao (cozinha/bar)**: vê apenas seus pedidos; marca RECEBIDO → EM_PREPARO → PRONTO dos itens da própria estação. Não vê preços/fechamento.

## 7. Notas mock-only (NÃO fazem parte do contrato do backend)

- `registrarPagamento(..., { simularErroFiscal })` — checkbox de demo que força o caminho de erro fiscal.
- Transporte de eventos: `BroadcastChannel('mesaplus.rt.v2')` entre abas (substituir por WS/SSE).
- Persistência: `localStorage['mesaplus.db.v2']` (blob único) e `sessionStorage['mesaplus.session.v2']` (sessão por aba).
- Emissão fiscal: `setTimeout ~2,5s` simulando o processamento assíncrono do ERP.

## 8. Fora do escopo v2 (não implementar sem nova decisão)

Cancelamento/estorno de item após envio · divisão de conta / pagamento parcial · CRUD de produto e mesa · edição do roteamento categoria→estação pela UI (setores é leitura) · som/alerta no KDS · impressão de qualquer tipo.
