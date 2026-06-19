# Diário da Guilda

Sistema de publicação de diários de RPG. Páginas públicas geradas estaticamente
(SSG) via Next.js, domínio isolado por trás de _ports_ e persistência em
Firestore via _adapters_.

> **Estado atual:** Fases 1–6 implementadas — domínio, integração Firestore,
> páginas públicas (SSG), autenticação do Mestre, área de gestão, deploy hook,
> servidor MCP e roteiros do mestre com notas ao vivo. Pendências em `TODO.md`.

## Arquitetura

```
src/
  core/            # domínio puro — NÃO importa Firestore
    entities/      # Guild, Adventure, Session, Adventurer, LooseEnd, StoryPlan + views
    ports/         # interfaces de repositório
    usecases/      # getFullGuild/Adventure/Session, create/update*, get/create/update StoryPlan, addStoryNote
  adapters/
    in-memory/     # adapter em memória (Fase 1 / fallback de dev)
    firestore/     # adapter Firestore (Admin SDK), um repository por entidade
    config/        # repository-factory (ÚNICO ponto que decide o adapter) + master-config
  app/
    (público)         # páginas SSG: /, /adventures/[slug], /sessions/[id]
    admin/            # área de gestão (client-gated por sessão) — dashboard, login, management/*
    story-plans/[id]  # visualizador do roteiro do mestre — sigiloso, gated no servidor (cookie + JWT)
    api/admin/        # rotas de gestão (sessions, adventurers, loose-ends, story-plans, publish) — sessions e story-plans com DELETE
    api/mcp/          # servidor MCP (JSON-RPC 2.0)
  components/
    public/           # TagBadge, PartyCard, TimelineEntryItem, AdventurerCard, LooseEndCard
    admin/            # SessionForm, AdventurerManager, LooseEndManager, StoryPlanManager/Document/Viewer, LiveNotesPanel
    ui/               # design system (Panel, Callout, Pill, Eyebrow, Stat, Field, ConfirmDialog, ...) — ver /design-system
  lib/             # sample-data, guild-data (loader cacheado), jwt, auth-middleware, admin-client/serializers
scripts/
  demo-phase1.ts   # demonstração do domínio em memória
  seed.ts          # popula o Firestore com os dados de exemplo
```

Princípios:

- A camada `core` depende apenas de interfaces (`ports`). Trocar de banco = trocar
  só `adapters/`.
- O **repository-factory** é o único lugar que escolhe o adapter:
  - credenciais do Firebase presentes → **Firestore**;
  - ausentes → **in-memory com dados de exemplo** (permite rodar tudo localmente
    sem Firestore, inclusive `npm run build`).
- `masterNotes` é filtrado no use case (`getFullSession`) antes de chegar às
  páginas públicas — nunca é renderizado publicamente.

## Setup

```bash
npm install
cp .env.example .env.local   # preencha quando tiver as credenciais
```

Sem `.env.local` preenchido, o app usa os dados de exemplo in-memory.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run demo:phase1` | Roda o domínio em memória e valida os badges contextuais por sessão (Fase 1) |
| `npm run seed` | Popula o Firestore com os dados de exemplo (requer credenciais) (Fase 2) |
| `npm run verify:firestore` | Lê a guild via Firestore real e valida o round-trip (Fase 2) |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Gera as páginas estáticas (Fase 3) |
| `npm run typecheck` | Checagem de tipos |
| `npm run lint` | ESLint |

## Variáveis de ambiente

Veja `.env.example`. Para as Fases 1–3 só importam (opcionalmente):

```bash
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=    # uma linha, com \n literais
MASTER_GUILD_ID=guild-aurora
```

Para as fases seguintes:

```bash
MASTER_PASSWORD=     # senha de login do Mestre (Fase 4)
JWT_SECRET=          # segredo do JWT — openssl rand -hex 32 (Fase 4)
DEPLOY_HOOK_URL=     # Vercel Deploy Hook, usado pelo botão Publicar (Fase 5)
MCP_SERVICE_TOKEN=   # token das escritas via MCP (Fase 6)
```

## Servidor MCP (Fase 6)

Endpoint: `POST /api/mcp` (JSON-RPC 2.0 / Streamable HTTP).

Tools expostas (todas declaram `outputSchema` e devolvem `structuredContent`
além do `content` textual):

| Tool | Tipo | Token? |
|---|---|---|
| `getGuildData(guildId?)` | leitura (sem `masterNotes`) | não |
| `listSessions(adventureId)` | leitura | não |
| `createSession(adventureId, …)` | escrita | sim |
| `updateSession(sessionId, …)` | escrita (patch parcial) | sim |
| `createAdventurer(adventureId, name, className, …)` | escrita | sim |
| `createLooseEnd(adventureId, title, …)` | escrita | sim |

O token (`MCP_SERVICE_TOKEN`) das escritas pode ser enviado de três formas:

```text
Header:  Authorization: Bearer <token>     →  POST /api/mcp
Query:   POST /api/mcp?token=<token>
Rota:    POST /api/mcp/<token>
```

> ⚠️ Token em URL (query/rota) pode aparecer em logs de proxies e no histórico.
> Prefira o header; use query/rota só quando o cliente MCP não suportar headers.

Exemplo (listar ferramentas):

```bash
curl -X POST http://localhost:3000/api/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Roteiros do Mestre

Material sigiloso de preparação de cena (pistas, testes, segredos, riscos,
escolhas do grupo) por aventura, com notas ao vivo lançadas durante a mesa.
Nunca aparece nas páginas públicas nem no `getGuildData` do MCP.

- **Gestão** (`/admin/management/story-plans`): cadastro/edição completos.
  Aceita `?edit=<id>&adventureId=<adv>` para abrir um roteiro específico já em
  modo de edição (usado pelos links "Editar" do dashboard).
- **Visualizador** (`/story-plans/[id]?adventureId=<adv>`): renderiza o roteiro
  no padrão visual das páginas públicas (mesmo layout raiz, sem o menu de
  gestão), mas a rota é dinâmica e verifica a sessão do Mestre no servidor
  (cookie + JWT) antes de renderizar — redireciona para `/admin/login` se não
  houver sessão válida. Inclui o painel de notas ao vivo (`LiveNotesPanel`).
- **Dashboard** (`/admin/dashboard`): lista todos os roteiros com contagem de
  cenas/notas e os atalhos "Ver" e "Editar".
- **MCP**: roteiros do mestre não são expostos via MCP (somente leitura
  pública/administrativa pela própria área de gestão).
- **Exclusão**: tanto roteiros quanto sessões podem ser excluídos pela área de
  gestão (`StoryPlanManager`, listagem de sessões e `SessionForm` em modo
  edição). A confirmação usa o componente `ConfirmDialog` (ver
  `/design-system`), que exige digitar o nome/identificador exato da entidade
  antes de habilitar o botão — proteção contra cliques acidentais em uma
  exclusão irreversível (hard delete, sem soft-delete/trash). Endpoints:
  `DELETE /api/admin/story-plans/[id]?adventureId=` e
  `DELETE /api/admin/sessions/[id]?adventureId=`.
