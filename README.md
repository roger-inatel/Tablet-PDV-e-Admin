# Mesa+ — Sistema de Restaurante (Frontend)

PDV para garçom + Painel administrativo de restaurante. **Somente frontend**, com dados
100% mockados, navegável e pronto para publicar na Vercel. A camada de dados está isolada
atrás de um "repositório" para que um backend NestJS possa ser plugado depois sem mexer nas
telas.

> Stack: **Next.js (App Router) · React · TypeScript · Tailwind CSS · Zustand**

## Como rodar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000. A raiz redireciona para `/admin`.

Outros scripts:

```bash
npm run build   # build de produção
npm run start   # sobe o build de produção
npm run lint    # ESLint
```

### Como testar o fluxo

1. **Admin** (`/admin`): veja o dashboard e navegue pela barra lateral (Garçons, Mesas,
   Impressoras, Produtos). Em **Mesas**, troque o responsável de uma mesa.
2. **PDV** (clique em "PDV Garçom" na barra inferior, ou em "Abrir PDV do garçom"):
   - Login: escolha **Carlos Lima** e digite o PIN **1234** → Entrar.
   - PINs de demonstração: Carlos `1234`, Marina `2222`, Bruno `3333`, Júlia `4444`.
   - Em **Mesas**, uma mesa livre abre a comanda; a mesa de outro garçom fica bloqueada.
   - Na **comanda**: adicione itens pelo catálogo, ajuste quantidade, **Enviar cozinha/bar**
     abre o modal separando os itens por setor → **Confirmar e imprimir**. Avance o status
     do item até *Pronto* e use **Fechar conta** para liberar a mesa.

## Rotas

| Rota | Descrição |
| --- | --- |
| `/` | redireciona para `/admin` |
| `/login` | login do garçom (cards + teclado PIN) |
| `/admin` | dashboard (KPIs, comandas abertas, mesas por status, garçons em serviço) |
| `/admin/garcons` | listagem de garçons (status, PIN, mesas atribuídas) |
| `/admin/mesas` | grid de mesas com seleção de responsável |
| `/admin/impressoras` | roteamento por setor + impressoras instaladas |
| `/admin/produtos` | cardápio por categoria |
| `/pdv` | grid de mesas do garçom (livre / sua / bloqueada) |
| `/pdv/mesa/[id]` | comanda da mesa (itens, catálogo, envio, fechar conta) |

## Estrutura de pastas

```
src/
  app/                  # rotas (App Router) + layouts + globals.css
    admin/              # painel administrativo (layout com sidebar)
    pdv/                # PDV do garçom (layout com guard de sessão)
    login/              # login do garçom
  components/
    ui/                 # primitivos reutilizáveis (StatusChip, Avatar, Icon, Modal…)
    admin/              # componentes do painel (sidebar, KPIs, cards, tabelas)
    pdv/                # componentes do PDV (mesa card, comanda, catálogo, modal)
    shell/              # StoreProvider, ModuleSwitcher, ToastHost, RequireWaiter
  data/                 # dados mockados (garçons, produtos, impressoras, mesas)
  lib/
    api/                # SEAM de repositório: types.ts + impl. mock (troque por NestJS aqui)
    domain/             # regras puras da comanda
    format.ts           # formatação (R$) e ids
  store/                # estado global (Zustand) + selectors derivados
  types/                # tipos e enums de domínio
```

## Como conectar um backend NestJS depois

Toda a UI consome `repos` de [`src/lib/api/index.ts`](src/lib/api/index.ts), que hoje aponta
para as implementações em `src/lib/api/mock/`. As **interfaces** estão em
[`src/lib/api/types.ts`](src/lib/api/types.ts). Para usar a API real, crie implementações que
façam `fetch(...)` e troque apenas o export em `index.ts` — nenhuma tela precisa mudar.

O estado operacional (mesas/comandas) é persistido localmente em `localStorage` (camada mock)
e a sessão/preferências via `zustand/persist`. Ao plugar o backend, essa persistência local é
substituída pelas chamadas HTTP.

## Publicar na Vercel

1. Suba o projeto para um repositório Git (GitHub/GitLab/Bitbucket).
2. Em https://vercel.com, **Add New → Project** e importe o repositório.
3. O framework é detectado automaticamente como **Next.js** (build `next build`).
4. **Não há variáveis de ambiente** a configurar. Clique em **Deploy**.

Alternativa via CLI: `npm i -g vercel` e rode `vercel` na pasta do projeto.
