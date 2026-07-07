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
- **Check** (comanda) `{ id, tableId, tableNum, waiterId, status, version, draftItems[], payment|null, fiscal|null, openedAt, closedAt|null }`.
- **DraftItem** `{ key, productId, name, unitPrice, station, qty }` — estágio pré-envio, sem status.
- **Order** (pedido) `{ id, checkId, tableId, tableNum, waiterId, seq, createdAt, items: OrderItem[] }` — um lote enviado; pode conter as duas estações.
- **OrderItem** `{ id, productId, name, unitPrice, station, qty, status, receivedAt?, startedAt?, readyAt? }`.
- **Payment** `{ id, method: 'cash'|'card'|'pix', amount, createdAt }` · **Fiscal** `{ status, attempts, errorMsg?, issuedAt?, accessKey? }`.
- **Session** `{ role:'waiter'|'manager', waiterId } | { role:'station', station }` — estado de cliente; backend usa token (JWT/cookie).

**Regra de dinheiro:** total exibido = drafts + itens de orders; total **cobrado** no checkout = apenas itens de orders. `startCheckout` é rejeitado com drafts pendentes.

## 2. Máquinas de estado

```
Check:      OPEN ──startCheckout──▶ IN_CHECKOUT ──fiscal ISSUED──▶ CLOSED
              ▲                          │
              └──────cancelCheckout──────┘   (somente enquanto payment === null)

Fiscal:     (null) ──payment.created──▶ PROCESSING ──▶ ISSUED  (terminal → Check CLOSED, mesa livre)
                                             │──▶ ERROR ──retry──▶ PROCESSING (attempts++)

OrderItem:  SENT ─receive─▶ RECEIVED ─start─▶ PREPARING ─ready─▶ READY  (estritamente linear)
```

Guards adicionais: editar/enviar exigem `OPEN`; `startCheckout` exige `draftItems.length === 0`; `registerPayment` exige `IN_CHECKOUT && !payment`; `retryFiscal` exige `fiscal.status === 'ERROR'`.

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
| `checks.startCheckout(id, expectedVersion)` | `POST /checks/:id/checkout` | responsável OU manager | 403, 409, 422 (drafts pendentes) |
| `checks.cancelCheckout(id)` | `DELETE /checks/:id/checkout` | responsável OU manager | 403, 422 (já pago) |
| `checks.registerPayment(id, method, expectedVersion)` | `POST /checks/:id/payments` | responsável OU manager | 403, 409, 422 |
| `checks.retryFiscal(id)` | `POST /checks/:id/fiscal/retry` | manager | 403, 422 |
| `checks.transfer(id, waiterId)` | `PATCH /checks/:id/waiter` | manager | 403, 404 |
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
| `payment.created` | `{ check, payment }` | pagamento registrado |
| `fiscal.error` | `{ check, error }` | emissão fiscal falhou |
| `check.closed` | `{ check, table }` | fiscal emitida; mesa liberada |

Recuperação de eventos perdidos: o cliente refaz `refresh()` (refetch geral) ao voltar a ficar visível (`visibilitychange`). O backend não precisa de replay/event-log para a v1 do contrato.

## 6. Regras por papel (resumo — código em `permissions.ts`)

- **waiter**: vê todas as mesas e pode abrir check de mesa livre; consulta check de outro garçom **somente leitura**; lança/edita drafts, envia order e fecha **apenas o próprio** check.
- **manager**: tudo de leitura + fechar/pagar checks pelo painel (caixa), retry fiscal, transferir responsável.
- **station (kitchen/bar)**: vê apenas seus orders; marca RECEIVED → PREPARING → READY dos itens da própria estação. Não vê preços/fechamento.

## 7. Notas mock-only (NÃO fazem parte do contrato do backend)

- `registerPayment(..., { simulateFiscalError })` — checkbox de demo que força o caminho de erro fiscal.
- Transporte de eventos: `BroadcastChannel('mesaplus.rt.v3')` entre abas (substituir por WS/SSE).
- Persistência: `localStorage['mesaplus.db.v3']` (blob único) e `sessionStorage['mesaplus.session.v3']` (sessão por aba).
- Emissão fiscal: `setTimeout ~2,5s` simulando o processamento assíncrono do ERP.

## 8. Fora do escopo v1 (não implementar sem nova decisão)

Cancelamento/estorno de item após envio · divisão de conta / pagamento parcial · CRUD de produto e mesa · edição do roteamento categoria→estação pela UI (stations é leitura) · som/alerta no KDS · impressão de qualquer tipo.
