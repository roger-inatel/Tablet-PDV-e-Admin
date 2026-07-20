# Mesa+ — Contratos Frontend ⇄ Backend

> **Status: implementado no frontend (mock), nomenclatura 100% em inglês.**
> Este documento é o espelho dos contratos que o frontend implementa hoje e que
> o backend NestJS deve honrar. Fontes de verdade no código:
> `src/types/index.ts` (modelo), `src/lib/api/types.ts` (repos),
> `src/lib/realtime/types.ts` (eventos), `src/lib/domain/stateMachines.ts`
> (máquinas de estado), `src/lib/domain/permissions.ts` (regras por papel).

## 1. Modelo de domínio

- **Table** `{ id, num, seats, checkId|null }` — ocupação é derivada de `checkId`.
- **Waiter** `{ id, name, initials, color, login, pin, role: 'waiter'|'manager', roleLabel, status, phone?, note? }` — `roleLabel` é texto de exibição (pt-BR).
- **Product** `{ id, name, category, station: 'kitchen'|'bar', price }` — `station` define o roteamento KDS. Valores de `category` são conteúdo do cardápio (pt-BR).
- **StationConfig** `{ id, name, description, color, icon, categories[] }`.
- **Check** (comanda) `{ id, tableId, tableNum, waiterId, status, version, draftItems[], payment|null, settlement?|null, openedAt, closedAt|null }`.
- **DraftItem** `{ key, productId, name, unitPrice, station, qty, notes? }` — estágio pré-envio, sem status. `notes` = observação p/ a estação.
- **Order** (pedido) `{ id, checkId, tableId, tableNum, waiterId, seq, createdAt, priority?, items: OrderItem[] }` — um lote enviado; pode conter as duas estações. `priority: 'normal'|'alta'|'urgente'` ordena o KDS.
- **OrderItem** `{ id, productId, name, unitPrice, station, qty, status, notes?, receivedAt?, startedAt?, readyAt?, voided?, voidedAt? }` — `voided` marca item removido por aprovação do gerente (mantido para auditoria; excluído de totais e do KDS via `activeItems`).
- **Payment** `{ id, method: 'cash'|'card'|'pix', amount, createdAt }` (resumo compatível; `method` = tender dominante, `amount` = total). **Settlement** `{ id, subtotal, discount, discountKind?, discountInput?, serviceFee, serviceFeeKind?, serviceFeeInput?, total, tenders: Tender[], paid, changeDue, createdAt }` — detalhe financeiro do caixa. **Tender** `{ id, method, amount, createdAt }`.
- **RemovalRequest** `{ id, checkId, tableNum, orderId, orderItemId, productId, itemName, qty, unitPrice, amount, reason, status: 'PENDING'|'APPROVED'|'REJECTED', requestedByWaiterId, requestedAt, decidedByManagerId?, decidedAt?, decisionNote? }` — solicitação de remoção; registros nunca apagados (auditoria).
- **Session** `{ role:'waiter'|'manager', waiterId } | { role:'station', station }` — estado de cliente; backend usa token (JWT/cookie).

**Regra de dinheiro:** total exibido = drafts + itens de orders; total **cobrado** no checkout = apenas itens de orders. `startCheckout` é rejeitado com drafts pendentes.

## 2. Máquinas de estado

```
Check:      OPEN ──startCheckout──▶ IN_CHECKOUT ──registerPayment──▶ CLOSED (mesa liberada)
              ▲                          │
              └──────cancelCheckout──────┘   (somente enquanto payment === null)

OrderItem:  SENT ─receive─▶ RECEIVED ─start─▶ PREPARING ─ready─▶ READY  (estritamente linear)
```

Guards adicionais: editar/enviar exigem `OPEN`; `startCheckout` exige `draftItems.length === 0`; `registerPayment` exige `IN_CHECKOUT && !payment` e **fecha a comanda na hora**, liberando a mesa (não há etapa de emissão de documento fiscal).

```
Remoção:  (garçom solicita) PENDING ──approve──▶ APPROVED  (item.voided = true)
                                    └──reject───▶ REJECTED  (item mantido)
```
Guards: `assertCanRequestRemoval` exige check `OPEN`, item não-voided, sem pendência para o item; `assertCanDecideRemoval` exige `status === 'PENDING'`. Separação de dinheiro (regra de negócio): **pagamento e cancelamento de fechamento são exclusivos do gerente** — o garçom só solicita o fechamento (`startCheckout`). Pagamento com **divisão em várias formas (tenders), desconto e taxa de serviço** (Settlement), com troco só em dinheiro.

## 3. Versionamento (concorrência otimista)

- **Toda** mutação de check incrementa `version`.
- `sendOrder`, `startCheckout` e `registerPayment` exigem `expectedVersion` (equivalente a `If-Match`); divergência → **409 Conflict**.
- Edições de draft e transições de item não carregam versão (a transição linear é o CAS do item).
- UX no front: 409 → refetch do check → toast "Comanda atualizada por outro usuário" → modal permanece aberto com dados atualizados (sem retry silencioso).

## 4. Endpoints (repo ⇄ REST) — papel exigido e erros

| Método do repo | Rota REST (NestJS) | Papel | Erros |
|---|---|---|---|
| `waiters.list()` | `GET /waiters` | manager (admin) / autenticado | — |
| `waiters.authenticate(id, pin)` | `POST /auth/login` | público | 401 |
| `waiters.save(w)` | `PUT /waiters/:id` | manager | 404 |
| `products.list()` | `GET /products` | autenticado | — |
| `products.categories()` | `GET /products/categories` | autenticado | — |
| `stations.list()` | `GET /stations` | autenticado | — |
| `tables.list()` | `GET /tables` | waiter, manager | — |
| `checks.list(filter?)` | `GET /checks?status=` | waiter (leitura), manager | — |
| `checks.get(id)` | `GET /checks/:id` | waiter (leitura), manager | 404 |
| `checks.open(tableId, waiterId)` | `POST /tables/:id/checks` | waiter | 404, 422 (mesa ocupada) |
| `checks.addDraftItem(id, productId)` | `POST /checks/:id/items` | waiter responsável | 403, 404, 422 |
| `checks.setDraftQty(id, key, delta)` | `PATCH /checks/:id/items/:key` | waiter responsável | 403, 404, 422 |
| `checks.sendOrder(id, expectedVersion)` | `POST /checks/:id/orders` | waiter responsável | 403, 409, 422 |
| `checks.setDraftItemNote(id, key, notes)` | `PATCH /checks/:id/items/:key/note` | waiter responsável | 403, 404, 422 |
| `checks.startCheckout(id, expectedVersion)` | `POST /checks/:id/checkout` | responsável OU manager | 403, 409, 422 (drafts pendentes) |
| `checks.cancelCheckout(id)` | `DELETE /checks/:id/checkout` | **manager** | 403, 422 (já pago) |
| `checks.registerPayment(id, input, expectedVersion)` | `POST /checks/:id/payments` | **manager** | 403, 409, 422 · `input = { discount?, serviceFee?, tenders[] }` (Settlement) |
| `checks.transfer(id, waiterId)` | `PATCH /checks/:id/waiter` | manager | 403, 404 |
| `removals.list()` | `GET /removals` | manager | — |
| `removals.request(orderId, itemId, reason, waiterId)` | `POST /removals` | waiter responsável | 403, 404, 422 |
| `removals.approve(id, managerId, note?)` | `POST /removals/:id/approve` | manager | 403, 404, 422 |
| `removals.reject(id, managerId, note?)` | `POST /removals/:id/reject` | manager | 403, 404, 422 |

`sendOrder` aceita `opts.priority`. Rotas DB da aplicação (Next API, best-effort/consulta): `POST /api/orders/record` (grava pedido pago no ERP com desconto/taxa/parcela por tender/vendedor), `POST /api/removals/record` + `GET /api/removals/list` (tabela própria `APP_REMOCAO_AUDITORIA` — criar via `prisma/sql/create_remocao_auditoria.sql`), `GET /api/dashboard` (agregação SQL do painel gerencial). Todas degradam com `{ available:false }` quando `DATABASE_URL` ausente.
| `orders.list()` | `GET /orders` | manager | — |
| `orders.listByStation(station)` | `GET /stations/:station/orders` | station correspondente | 403 |
| `orders.receive(orderId, station)` | `POST /orders/:id/receive` | station (itens da própria estação) | 403, 422 |
| `orders.advanceItem(orderId, itemId, to)` | `POST /orders/:id/items/:itemId/transition` | station do item | 403, 404, 422 |

Códigos: `409 ConflictError` (versão), `403 ForbiddenError`, `422 InvalidTransitionError`, `404 NotFoundError` — ver `src/lib/api/errors.ts`.

## 5. Eventos em tempo real (WebSocket/SSE)

Envelope: `{ id, type, ts, origin, payload }`. Payloads carregam **snapshots completos** (check com `version`); o cliente aplica upsert guardado por `version >` — idempotente e tolerante a reordenação.

| Evento | Payload | Emitido quando |
|---|---|---|
| `check.opened` | `{ check, table }` | garçom assume mesa livre |
| `check.updated` | `{ check }` | edição de drafts / transferência / cancelamento |
| `order.sent` | `{ order, check }` | envio de drafts como order |
| `order_item.received` | `{ order, itemId, station }` | KDS confirma recebimento |
| `order_item.preparing` | `{ order, itemId, station }` | KDS inicia preparo |
| `order_item.ready` | `{ order, itemId, station }` | KDS marca pronto |
| `check.checkout_started` | `{ check }` | fechamento iniciado |
| `check.closed` | `{ check, table }` | pagamento registrado; comanda fechada e mesa liberada |
| `removal.requested` | `{ removal }` | garçom solicita remoção de item |
| `removal.approved` | `{ removal, order }` | gerente aprova → item voided |
| `removal.rejected` | `{ removal }` | gerente rejeita |

Recuperação de eventos perdidos: o cliente refaz `refresh()` (refetch geral) ao voltar a ficar visível (`visibilitychange`). O backend não precisa de replay/event-log para a v1 do contrato.

## 6. Regras por papel (resumo — código em `permissions.ts`)

- **waiter**: vê todas as mesas e pode abrir check de mesa livre; consulta check de outro garçom **somente leitura**; lança/edita drafts (com observação e prioridade no envio), envia order e **solicita o fechamento** do próprio check (`startCheckout`). **NÃO recebe pagamento, não escolhe forma de pagamento, não cancela fechamento.** Pode **solicitar** remoção de item (com motivo) — nunca remove diretamente. Após "Fechar conta" a mesa fica bloqueada 🔴 "Aguardando pagamento" e sai de ação do garçom.
- **manager**: tudo de leitura + **todo o financeiro** (pagar com divisão/desconto/taxa, cancelar fechamento), transferir responsável, **aprovar/rejeitar remoções**, painel gerencial e auditoria.
- **station (kitchen/bar)**: vê apenas seus orders (colunas Novo Pedido/Em Preparo/Pronto, ordenados por prioridade); marca RECEIVED → PREPARING → READY dos itens da própria estação. Não vê preços/fechamento.

## 7. Notas mock-only (NÃO fazem parte do contrato do backend)

- Transporte de eventos: `BroadcastChannel('mesaplus.rt.v3')` entre abas (substituir por WS/SSE).
- Persistência: `localStorage['mesaplus.db.v3']` (blob único) e `sessionStorage['mesaplus.session.v3']` (sessão por aba).

## 8. Implementado nesta fase (revoga o "fora de escopo" anterior)

- **Remoção de item após envio** com aprovação do gerente + auditoria permanente (`RemovalRequest`, `item.voided`).
- **Divisão de conta / pagamento parcial** via `Settlement.tenders`, com **desconto** e **taxa de serviço** (troco só em dinheiro).
- **Separação garçom×caixa**: pagamento e cancelamento de fechamento são manager-only.
- **KDS**: observações por item, prioridade do pedido, colunas "Novo Pedido/Em Preparo/Pronto", animação de entrada.
- **Painel gerencial** (`/admin/dashboard`) consumindo o ERP real (SQL) + KPIs operacionais/auditoria ao vivo; **auditoria** (`/admin/audit`) com filtros e exportação Excel/PDF.

- **Sem emissão de documento fiscal (NF-e/NFC-e)**: o pagamento fecha a comanda direto e libera a mesa. Não há status fiscal, reemissão nem chave de acesso.

Ainda fora de escopo: CRUD de produto e mesa · edição do roteamento categoria→estação pela UI · som/alerta no KDS · impressão.

## 9. Provisionamento do banco (ERP real)

- `pnpm db:seed` (ou `node prisma/seed.cjs`) grava a **massa mestre** idempotente (empresa 900001, cliente avulso, forma PIX, produtos/preços demo) exigida para gravar pedidos pagos em `TB_PEDIDO`. Sem ela, o `POST /api/orders/record` falha na FK `FK_TB_PEDIDO_FILIAL` (o fluxo mock segue normal, best-effort).
- A auditoria de remoções usa a tabela própria `APP_REMOCAO_AUDITORIA` — rodar `prisma/sql/create_remocao_auditoria.sql` **à mão** (o schema é `db pull` introspectado; **nunca `prisma migrate`**). Sem a tabela, a auditoria funciona via `localStorage` (autoritativa em dev).
