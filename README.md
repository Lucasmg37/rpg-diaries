# Diário da Guilda

Sistema de publicação de diários de RPG. Páginas públicas geradas estaticamente
(SSG) via Next.js, domínio isolado por trás de _ports_ e persistência em
Firestore via _adapters_.

> **Estado atual:** Fases 1–6 implementadas — domínio, integração Firestore,
> páginas públicas (SSG), autenticação do Mestre, área de gestão, deploy hook,
> servidor MCP e roteiros do mestre com notas ao vivo. Concluído: migração do
> histórico de aventureiros para **event sourcing** e entidade de **NPCs &
> Bosses** (mesmo padrão de event sourcing, ver seções próprias abaixo).
> Pendências em `TODO.md`.

## Arquitetura

```
src/
  core/            # domínio puro — NÃO importa Firestore
    entities/      # Guild, Adventure, Session, Adventurer, AdventurerEvent, Npc, NpcEvent, LooseEnd, StoryPlan + views
    ports/         # interfaces de repositório (inclui AdventurerEventRepository, NpcRepository, NpcEventRepository)
    usecases/      # getFullGuild/Adventure/Session, create/update*, projectSnapshot,
                    # appendAdventurerEvent/rebuildSnapshot, getAdventurerWithTimeline,
                    # deriveSessionBadge, get/create/update StoryPlan, addStoryNote,
                    # createNpc/updateNpc, appendNpcEvent/retconNpcEvent/projectNpcSnapshot,
                    # getNpcWithTimeline, markNpcSeenByAdventurers, getAdventureNpcRoster
  adapters/
    in-memory/     # adapter em memória (Fase 1 / fallback de dev)
    firestore/     # adapter Firestore (Admin SDK), um repository por entidade
                    # (adventurerEvents/npcEvents são subcoleções por aventura, não top-level)
    config/        # repository-factory (ÚNICO ponto que decide o adapter) + master-config
  app/
    (público)         # páginas SSG: /, /adventures/[slug], /sessions/[id], /adventurers/[id], /npcs/[id]
    admin/            # área de gestão (client-gated por sessão) — dashboard, login, management/*
                       # (inclui management/adventurers/[id] e management/npcs/[id] — perfil + timeline + form de evento)
    story-plans/[id]  # visualizador do roteiro do mestre — sigiloso, gated no servidor (cookie + JWT)
    api/admin/        # rotas de gestão (sessions, adventurers, adventurers/[id]/events, loose-ends,
                       # story-plans, npcs, npcs/[id]/events, publish) — sessions, story-plans e npcs com DELETE
    api/mcp/          # servidor MCP (JSON-RPC 2.0)
  components/
    public/           # TagBadge, PartyCard, TimelineEntryItem, AdventurerCard, AdventurerTimeline,
                       # NpcCard, NpcTimeline, LooseEndCard
    admin/            # SessionForm, AdventurerManager, AdventurerDetail, AdventurerEventForm,
                       # AdventurerTimeline, NpcManager, NpcDetail, NpcEventForm, NpcTimeline,
                       # LooseEndManager, StoryPlanManager/Document/Viewer, LiveNotesPanel
    ui/               # design system (Panel, Callout, Pill, Eyebrow, Stat, Field, ConfirmDialog, ...) — ver /design-system
  lib/             # sample-data, guild-data (loader cacheado), npc-view, jwt, auth-middleware, admin-client/serializers
scripts/
  demo-phase1.ts                  # demonstração do domínio em memória
  seed.ts                         # popula o Firestore com os dados de exemplo
  backup-firestore.ts             # dump completo da árvore guilds/... para backups/*.json
  migrate-adventurer-events.ts    # gera os eventos retroativos das Sessões 1-3 (uso único / referência)
  test-project-snapshot.ts        # auto-teste do reducer projectSnapshot (sem framework de testes)
```

Princípios:

- A camada `core` depende apenas de interfaces (`ports`). Trocar de banco = trocar
  só `adapters/`.
- O **repository-factory** é o único lugar que escolhe o adapter:
  - credenciais do Firebase presentes → **Firestore**;
  - ausentes → **in-memory com dados de exemplo** (permite rodar tudo localmente
    sem Firestore, inclusive `npm run build`).
- `masterNotes` (roteiros) é filtrado no use case (`getFullSession`) antes de
  chegar às páginas públicas — nunca é renderizado publicamente. O mesmo
  princípio vale para eventos de aventureiro com `visibility: "master"` (ver
  abaixo).

## Histórico de aventureiros (event sourcing)

O estado de um `Adventurer` (nível, status, inventário, títulos) **não é mais
um campo editado à mão** — é uma **projeção derivada de uma timeline de
eventos imutáveis**. Isso elimina a classe de bug em que o nível ficava
"travado" porque alguém esquecia de atualizar um campo solto.

- `Adventurer` só guarda identidade (`name`, `className`, `icon`,
  `background`, `goal`, `sheetUrl`) + `snapshot`. **Não existem mais campos
  `level`/`status`** no tipo nem nos documentos Firestore — corte concluído
  (Fase 2). Use `adventurerLevel(a)`/`adventurerStatusLabel(a)`/
  `isAdventurerDead(a)` (`lib/adventurer-view.ts`) para exibição.
- `AdventurerEvent` (`core/entities/adventurer-event.ts`): união discriminada
  por `type` (`joined`, `level_up`, `status_change`, `state_flag`,
  `item_gained`, `item_lost`, `relationship`, `injury`, `death`, `revival`,
  `title_badge`, `sheet_revision`, `story_beat`). Append-only — eventos nunca
  são editados ou apagados; correções usam `retconAdventurerEvent` (grava um
  novo evento marcado com `retcons: targetEventId` e marca o original com
  `retconnedBy`, que o reducer ignora). Disponível no admin (botão "Corrigir"
  em cada nó da timeline) e no MCP (`retconAdventurerEvent`).
- Eventos cross-character (ex.: um soco) existem **uma única vez**, com
  `actorId` (dono) + `targetIds` (demais envolvidos) + `participantIds`
  (denormalizado, índice de leitura `array-contains` no Firestore).
- `createAdventurer` grava, na criação, um evento `joined` automático (nível
  inicial configurável, padrão 1) — todo aventureiro tem `snapshot` desde o
  primeiro instante; não existe "aventureiro sem timeline".
- `projectSnapshot` (`core/usecases/project-snapshot.ts`) é o reducer puro que
  dobra a timeline de um aventureiro (eventos onde ele é `actorId`) num
  `AdventurerSnapshot` — cache de leitura recomputado a cada
  `appendAdventurerEvent`/`retconAdventurerEvent`, gravado em
  `Adventurer.snapshot`.
- `deriveSessionBadge` (`core/usecases/derive-session-badge.ts`) projeta o
  badge/estado contextual de uma sessão (`SessionParticipant.sessionBadge`/
  `sessionState`) a partir dos eventos daquela sessão, com fallback para o
  texto armazenado quando não há eventos. **Decisão tomada:** os dois modos
  coexistem permanentemente — não há plano de exigir eventos em toda sessão.
- Visibilidade: eventos `visibility: "master"` aparecem na timeline do admin
  (`/admin/management/adventurers/[id]`), mas são filtrados na timeline
  pública (`/adventurers/[id]`, via `getPublicAdventurerTimeline`).
- Índices compostos do Firestore (`participantIds` array-contains combinado
  com `visibility`/`sessionId`/`arcId`) estão declarados em
  `firestore.indexes.json` (+ `firebase.json`). Deploy manual:
  `firebase use <project> && firebase deploy --only firestore:indexes`.

## NPCs & Bosses

Personagens não-jogáveis (NPCs comuns e Bosses) seguem o **mesmo padrão de
event sourcing** dos aventureiros: identidade fixa (`Npc`) + timeline
imutável de eventos (`NpcEvent`) + `NpcSnapshot` derivado, nunca editado à
mão.

- `Npc` (`core/entities/npc.ts`): `kind` (`npc`/`boss`), `description`
  (pública — personalidade/história), `masterNotes?` (sigiloso, nunca exposto
  fora da área logada/MCP autenticado), `stats?` (ficha resumida estilo
  Tormenta — `classOrType`, `pv`, `pm`, `defesa`, `resistencias`, `atributos`,
  `ataques`, `pericias`, `habilidades`, pensada para consulta rápida durante o
  combate) e `sheetUrl?`.
- `NpcEvent` (`core/entities/npc-event.ts`): união discriminada por `type`
  (`status_change`, `appearance`, `item_gained`, `item_lost`, `relationship`,
  `note`). Append-only, com retcon (`retconNpcEvent`) no mesmo esquema de
  `retconAdventurerEvent`.
  - `status_change` move `NpcStatus` (`alive` → `dead` → `revived` →
    `missing` → `unknown`).
  - `appearance` registra `sessionId` + `seenByAdventurerIds[]` — é o que
    libera a ficha pública do NPC: só quem o "viu" (e só sessões onde ele
    apareceu) entram em `NpcSnapshot.seenByAdventurerIds`/
    `appearedInSessionIds`.
- `createNpc` grava, na criação, um evento `status_change` automático
  (`unknown` → `alive`, `visibility: "master"`) — todo NPC tem `snapshot`
  desde o primeiro instante, igual ao `joined` do Adventurer.
- Vínculo com Session/StoryPlan: `Session.npcIds?: string[]` e
  `Scene.npcIds?: string[]` (StoryPlan) são listas simples que o mestre marca
  manualmente nos formulários (`SessionForm`/`StoryPlanManager`) — servem
  para planejamento ("quem pode aparecer aqui"). A fonte de verdade de quem
  **de fato** apareceu e foi visto é o evento `appearance` na timeline do
  NPC, gravado via `markNpcSeenByAdventurers` (usecase) / `markNpcSeen`
  (MCP) — normalmente disparado quando o mestre confirma a cena na mesa.
- Visibilidade pública: a home/aventura/sessão só listam (e só geram página
  estática para) NPCs com `appearedInSessionIds` não vazio
  (`getPublicNpcRoster`/`lib/npc-view.ts#npcHasAppeared`) — um NPC cadastrado
  mas nunca apresentado é só preparo do mestre, invisível ao público. A
  ficha pública (`/npcs/[id]`) nunca expõe `masterNotes` nem eventos
  `visibility: "master"`.
- Modo combate: `/admin/management/npcs/[id]` (`NpcDetail`) renderiza
  `stats` (PV, PM, Defesa, resistências, ataques) num painel compacto para
  consulta rápida durante a mesa, além da ficha completa e da timeline com
  o botão "Corrigir" (retcon).
- Índices compostos do Firestore para `npcEvents` (`npcId` combinado com
  `visibility`/`sessionId`/`arcId`) estão declarados em
  `firestore.indexes.json`, junto aos de `adventurerEvents`.

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
| `npm run backup:firestore` | Dump completo da árvore `guilds/...` para `backups/*.json` (não versionado) |
| `npm run test:project-snapshot` | Auto-teste do reducer `projectSnapshot` |
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
| `getAdventurer(adventurerId, adventureId?)` | leitura (aventureiro + timeline completa) | não |
| `createSession(adventureId, …)` | escrita | sim |
| `updateSession(sessionId, …)` | escrita (patch parcial, inclui `closing`) | sim |
| `createAdventurer(adventureId, name, className, …)` | escrita | sim |
| `updateAdventurer(adventureId, adventurerId, …)` | escrita (só identidade — nível/status via evento) | sim |
| `appendAdventurerEvent(adventureId, type, actorId, …)` | escrita (timeline, append-only) | sim |
| `retconAdventurerEvent(adventureId, targetEventId, …)` | escrita (corrige um evento já gravado) | sim |
| `createLooseEnd(adventureId, title, …)` | escrita | sim |
| `updateLooseEnd(adventureId, looseEndId, …)` | escrita (patch parcial) | sim |
| `listNpcs(adventureId, kind?, status?, seenByAdventurerId?)` | leitura (sem `masterNotes` sem token) | não |
| `getNpc(adventureId, npcId)` | leitura (NPC + timeline; sem `masterNotes`/eventos `master` sem token) | não |
| `createNpc(adventureId, kind, name, description, …)` | escrita | sim |
| `updateNpc(adventureId, npcId, …)` | escrita (patch parcial — status/inventário só via evento) | sim |
| `appendNpcEvent(adventureId, npcId, type, title, …)` | escrita (timeline, append-only) | sim |
| `markNpcSeen(adventureId, npcId, sessionId, seenByAdventurerIds)` | escrita (atalho para `appendNpcEvent` tipo `appearance`) | sim |
| `retconNpcEvent(adventureId, npcId, targetEventId, …)` | escrita (corrige um evento já gravado) | sim |

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
  modo de edição (usado pelos links "Editar" do dashboard). Cada cena tem um
  checklist de NPCs/Bosses previstos (`scene.npcIds`), carregado da aventura
  selecionada.
- **Visualizador** (`/story-plans/[id]?adventureId=<adv>`): renderiza o roteiro
  no padrão visual das páginas públicas (mesmo layout raiz, sem o menu de
  gestão), mas a rota é dinâmica e verifica a sessão do Mestre no servidor
  (cookie + JWT) antes de renderizar — redireciona para `/admin/login` se não
  houver sessão válida. Inclui o painel de notas ao vivo (`LiveNotesPanel`) e,
  ao fim de cada cena, os NPCs/Bosses vinculados (`scene.npcIds` resolvidos
  contra a aventura).
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
