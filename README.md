# Mesa+ — Sistema de Restaurante (Frontend v2)

Frontend de produção (ainda **100% mockado**) para operação de restaurante com **4
superfícies**: PDV do garçom, painel administrativo/caixa e **KDS** (telas de
cozinha e bar que substituem impressoras). Tudo estruturado por papéis, estações
e estados — com **tempo real entre abas**, **concorrência otimista** e
**fechamento fiscal assíncrono** — pronto para plugar um backend NestJS.

> Stack: **Next.js (App Router) · React · TypeScript · Tailwind CSS · Zustand**

## Como rodar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000 — a raiz leva cada aba para a superfície do seu perfil
(ou para `/login`).

> ⚠️ Não rode `npm run build` com o `npm run dev` aberto (ambos escrevem em `.next`).

## Perfis de demonstração

| Perfil | Acesso | Vai para |
|---|---|---|
| Carlos Lima (garçom) | PIN **1234** | `/garcom` |
| Marina Souza (garçonete) | PIN **2222** | `/garcom` |
| Bruno Alves (garçom) | PIN **3333** | `/garcom` |
| Júlia Reis (garçonete) | PIN **4444** | `/garcom` |
| Renata Prado (gerente) | PIN **9999** | `/admin` |
| Cozinha / Bar (KDS) | 1 toque, sem PIN | `/kds/cozinha` · `/kds/bar` |

A sessão é **por aba** (sessionStorage): abra duas abas com perfis diferentes
(ex.: garçom + KDS Cozinha) e veja os eventos fluírem ao vivo entre elas.

## Fluxo principal (demo em 2 abas)

1. **Aba A** — login Carlos → mesa livre → adicionar itens → **Enviar pedido**
   (o modal mostra o roteamento Cozinha/Bar).
2. **Aba B** — KDS Cozinha: o pedido chega **sem refresh**, destacado como
   **NOVO** → *Receber pedido* → *Iniciar* → *Pronto*.
3. **Aba A** — os chips dos itens avançam ao vivo (Enviado → Recebido → Em
   preparo → Pronto).
4. **Fechar conta** → iniciar fechamento → método de pagamento (dinheiro/cartão/
   PIX) → emissão NFC-e **assíncrona** → comanda fechada e mesa livre. Marque
   *"Simular falha fiscal"* para demonstrar o erro + reemissão pelo caixa em
   `/admin/comandas`.

## Papéis e regras (espelhadas do futuro backend)

- **Garçom**: vê todas as mesas; abre mesa livre; consulta comanda de outro
  garçom **somente leitura**; lança/edita/envia/fecha apenas a própria comanda.
- **Gerente**: painel completo + caixa (fechar/pagar comandas, reemitir NFC-e,
  transferir responsável).
- **Estação (KDS)**: vê só a própria fila; marca Recebido → Em preparo → Pronto.
  Não vê preços nem fechamento.

Regras em [`src/lib/domain/permissions.ts`](src/lib/domain/permissions.ts);
máquinas de estado em [`src/lib/domain/maquinas.ts`](src/lib/domain/maquinas.ts).

## Rotas

| Rota | Superfície |
|---|---|
| `/login` | hub de perfis (garçons · gerência · KDS) |
| `/garcom` · `/garcom/mesa/[id]` | PDV do garçom (grid de mesas · comanda) |
| `/kds/cozinha` · `/kds/bar` | KDS das estações (board Recebido/Em preparo/Pronto) |
| `/admin` | dashboard (KPIs, comandas ativas, alerta fiscal) |
| `/admin/comandas` | comandas & caixa (fechar, pagar, reemitir NFC-e) |
| `/admin/mesas` · `/admin/garcons` · `/admin/produtos` · `/admin/setores` | cadastros/operacão |
| `/pdv*` · `/admin/impressoras` | redirects para as rotas novas |

## Arquitetura (resumo)

```
src/
  app/                  # rotas: login, garcom, kds/[estacao], admin/*
  components/           # ui/ · shell/ (sessão, realtime, guards) · garcom/ · kds/ · admin/ · comanda/
  data/                 # seeds: garcons, produtos, estacoes, mesas, comandas, pedidos
  lib/
    api/                # SEAM: types.ts (contratos) + mock/ (repos + fiscalService)
    domain/             # permissions, maquinas (estados), pedido/comanda (puros)
    realtime/           # contrato de eventos + transporte BroadcastChannel
  store/                # Zustand: sessão por aba, cache reconciliado por eventos
  types/                # modelo: Mesa ≠ Comanda ≠ Pedido ≠ ItemPedido
docs/CONTRACTS.md       # contrato completo p/ o backend NestJS
```

- **Domínio**: `Comanda` (ABERTA → EM_FECHAMENTO → FECHADA, com `version`) ≠
  `Pedido` (lote enviado, roteado por estação) ≠ `ItemPedido`
  (ENVIADO → RECEBIDO → EM_PREPARO → PRONTO, avançado só pelo KDS).
- **Tempo real**: eventos tipados com snapshot + guarda de versão
  ([`src/lib/realtime`](src/lib/realtime)); mock via BroadcastChannel — trocar por
  WebSocket/SSE sem tocar no store.
- **Concorrência otimista**: `expectedVersion` em enviar/fechar/pagar → conflito
  vira toast + refresh (sem retry silencioso).
- **Fiscal assíncrono**: pagamento → `PROCESSANDO` → evento posterior `EMITIDA`
  (fecha e libera a mesa) ou `ERRO` (retry pelo caixa).

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
   auto-detectado; **sem variáveis de ambiente**).
3. **Deploy**. Cada `git push` na `main` redeploya.
