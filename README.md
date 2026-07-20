# Mesa+ — Sistema de Restaurante (Frontend)

Frontend de produção (ainda **100% mockado**) para operação de restaurante com **4
superfícies**: PDV do garçom, painel administrativo/caixa e **KDS** (telas de
cozinha e bar que substituem impressoras). Estruturado por papéis, estações e
estados — com **tempo real entre abas**, **concorrência otimista** e
**separação garçom × caixa** — pronto para plugar um backend NestJS.
Nomenclatura interna 100% em inglês; textos de interface em pt-BR.

> Stack: **Next.js (App Router) · React · TypeScript · Tailwind CSS · Zustand · PNPM**

## Como rodar localmente

```bash
pnpm install
pnpm dev
```

Abra http://localhost:3000 — a raiz leva cada aba para a superfície do seu perfil
(ou para `/login`).

> ⚠️ Não rode `pnpm build` com o `pnpm dev` aberto (ambos escrevem em `.next`).

## Perfis de demonstração

| Perfil | Acesso | Vai para |
|---|---|---|
| Carlos Lima (garçom) | PIN **1234** | `/waiter` |
| Marina Souza (garçonete) | PIN **2222** | `/waiter` |
| Bruno Alves (garçom) | PIN **3333** | `/waiter` |
| Júlia Reis (garçonete) | PIN **4444** | `/waiter` |
| Renata Prado (gerente) | PIN **9999** | `/admin` |
| Cozinha / Bar (KDS) | 1 toque, sem PIN | `/kds/kitchen` · `/kds/bar` |

A sessão é **por aba** (sessionStorage): abra duas abas com perfis diferentes
(ex.: garçom + KDS Cozinha) e veja os eventos fluírem ao vivo entre elas.

## Fluxo principal (demo em 2 abas)

1. **Aba A** — login Carlos → mesa livre → adicionar itens → **Enviar pedido**
   (o modal mostra o roteamento Cozinha/Bar).
2. **Aba B** — KDS Cozinha: o pedido chega **sem refresh**, destacado como
   **NOVO** → *Receber pedido* → *Iniciar* → *Pronto*.
3. **Aba A** — os chips dos itens avançam ao vivo (Enviado → Recebido → Em
   preparo → Pronto).
4. **Aba A (garçom)** — **Fechar conta** apenas *solicita* o encerramento: a mesa
   fica bloqueada 🔴 *"Aguardando pagamento (caixa)"*. O garçom não recebe
   pagamento.
5. **Aba B (gerente)** — `/admin/checks` → *Registrar pagamento*: desconto, taxa
   de serviço e **divisão em várias formas** (dinheiro/cartão/PIX) com troco →
   comanda fechada e mesa livre na hora.

## Papéis e regras (espelhadas do futuro backend)

- **waiter**: vê todas as mesas; abre mesa livre; consulta comanda de outro
  garçom **somente leitura**; lança/edita/envia e **solicita o fechamento** da
  própria comanda. Não recebe pagamento nem remove itens direto (apenas
  **solicita** a remoção, com motivo).
- **manager**: painel completo + caixa (pagar com desconto/taxa/divisão,
  transferir responsável, aprovar/rejeitar remoções, painel gerencial e
  auditoria).
- **station (kitchen/bar)**: vê só a própria fila; marca Recebido → Em preparo →
  Pronto. Não vê preços nem fechamento.

Regras em [`src/lib/domain/permissions.ts`](src/lib/domain/permissions.ts);
máquinas de estado em [`src/lib/domain/stateMachines.ts`](src/lib/domain/stateMachines.ts).

## Rotas

| Rota | Superfície |
|---|---|
| `/login` | hub de perfis (garçons · gerência · KDS) |
| `/waiter` · `/waiter/table/[id]` | PDV do garçom (grid de mesas · comanda) |
| `/kds/kitchen` · `/kds/bar` | KDS das estações (board Novo Pedido/Em Preparo/Pronto) |
| `/admin` | dashboard operacional (KPIs, comandas ativas) |
| `/admin/dashboard` | painel gerencial (KPIs, gráficos e rankings do banco) |
| `/admin/checks` | comandas & caixa (fechar, pagar com desconto/taxa/divisão) |
| `/admin/removals` · `/admin/audit` | remoções de itens (aprovação) e auditoria + exportação |
| `/admin/tables` · `/admin/waiters` · `/admin/products` · `/admin/stations` | cadastros/operação |
| `/pdv*` · `/garcom*` · `/kds/cozinha` · `/admin/{comandas,garcons,mesas,produtos,setores,impressoras}` | redirects para as rotas novas |

## Arquitetura (resumo)

```
src/
  app/                  # rotas: login, waiter, kds/[station], admin/*
  components/           # ui/ · shell/ (sessão, realtime, guards) · waiter/ · kds/ · admin/ · check/
  data/                 # seeds: waiters, products, stations, tables, checks, orders
  lib/
    api/                # SEAM: types.ts (contratos) + mock/ (repos)
    domain/             # permissions, stateMachines, order/check (puros)
    realtime/           # contrato de eventos + transporte BroadcastChannel
  store/                # Zustand: sessão por aba, cache reconciliado por eventos
  types/                # modelo: Table ≠ Check ≠ Order ≠ OrderItem
docs/CONTRACTS.md       # contrato completo p/ o backend NestJS
```

- **Domínio**: `Check` (OPEN → IN_CHECKOUT → CLOSED, com `version`) ≠ `Order`
  (lote enviado, roteado por estação) ≠ `OrderItem`
  (SENT → RECEIVED → PREPARING → READY, avançado só pelo KDS).
- **Tempo real**: eventos tipados com snapshot + guarda de versão
  ([`src/lib/realtime`](src/lib/realtime)); mock via BroadcastChannel — trocar por
  WebSocket/SSE sem tocar no store.
- **Concorrência otimista**: `expectedVersion` em enviar/fechar/pagar → conflito
  vira toast + refresh (sem retry silencioso).
- **Fechamento**: o pagamento do caixa (com desconto/taxa/divisão) fecha a
  comanda e libera a mesa na hora — sem emissão de documento fiscal.

## Como conectar o backend NestJS

Toda a UI consome `repos` de [`src/lib/api/index.ts`](src/lib/api/index.ts) e o
`RealtimeClient` de [`src/lib/realtime`](src/lib/realtime). Implemente ambos
contra a API real (fetch + WS/SSE) e troque **apenas esses exports** — telas,
store e regras não mudam. O contrato completo (endpoints ⇄ papéis ⇄ erros,
schemas de eventos, máquinas de estado, versionamento) está em
[`docs/CONTRACTS.md`](docs/CONTRACTS.md).

## Publicar na Vercel

1. Suba o repositório para o GitHub.
2. Em https://vercel.com → **Add New → Project** → importe (framework Next.js
   auto-detectado; a Vercel usa PNPM automaticamente ao ver o `pnpm-lock.yaml`;
   **sem variáveis de ambiente**).
3. **Deploy**. Cada `git push` na `main` redeploya.
