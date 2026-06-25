# TODO — Diário da Guilda

Funcionalidades pendentes. **Fases 1–6 concluídas** (domínio, Firestore, páginas
públicas SSG, autenticação do Mestre, área de gestão, servidor MCP, roteiros do
mestre com notas ao vivo). O que falta:

---

## Navegação pública (NPCs, About, Aventureiros/Fios Soltos)

Página pública `/about` (com botão que abre uma modal exibindo um ditado
aleatório da guilda, reaproveitando `lib/guild-messages.ts`, também usado no
footer); lista pública geral `/npcs` (todos os NPCs/Bosses já apresentados,
agrupados por aventura); páginas dedicadas
`/adventures/[slug]/adventurers` e `/adventures/[slug]/loose-ends` (antes um
único card "Aventureiros & Fios Soltos" na home/aventura); menu "NPCs &
Bosses" no dashboard do mestre (`/admin/management/npcs`) — **concluído**.

---

## Event sourcing de aventureiros

Migração do histórico de aventureiros de campos editados à mão para timeline
de eventos imutáveis + snapshot derivado — **concluída**. Detalhes em
`README.md` (seção "Histórico de aventureiros").

---

## NPCs & Bosses

Entidade `Npc`/`NpcEvent` (mesmo padrão de event sourcing dos aventureiros),
ports/usecases/adapters (in-memory + Firestore), tools MCP
(`listNpcs`/`getNpc`/`createNpc`/`updateNpc`/`appendNpcEvent`/`markNpcSeen`/
`retconNpcEvent`), UI de gestão com modo combate, ficha pública condicionada a
aparição em sessão, e vínculo com `Session.npcIds`/`Scene.npcIds` — **concluído**.
Detalhes em `README.md` (seção "NPCs & Bosses"). Pendências específicas em
"Lacunas da gestão" abaixo (guarda referencial do delete, criação inline).

---

## Fase 7 — Polimento e hardening

- [ ] ~~Rate limiting no login~~ — **despriorizado**: auth será migrada para o Firebase
- [ ] Regras de segurança do Firestore (deny-all; defesa em profundidade — o Admin SDK as ignora)
- [ ] Deploy dos índices compostos do Firestore (`firestore.indexes.json` já
  declarado; falta `firebase use <project> && firebase deploy --only firestore:indexes`)

---

## Lacunas da gestão

- [x] **Delete** de sessão / roteiro do mestre (confirmação por digitação do nome; hard delete, sem guarda de integridade referencial ainda)
- [x] **Delete** de NPC/Boss (`DELETE /api/admin/npcs/[id]`) — mesma observação de guarda referencial abaixo
- [ ] **Delete** de aventureiro / fio solto / NPC (mesmo padrão; falta guarda de integridade referencial — são referenciados entre si, ex.: sessão → aventureiro/fio solto/NPC, cena de roteiro → NPC)
- [ ] CRUD de **aventuras** (hoje só via seed; não há `create-adventure`)
- [ ] Reordenação de sessões/aventuras/roteiros (campo `order`/`number` editável por arraste)
- [ ] (Opcional) Criação inline de **aventureiro**/**NPC** dentro do `SessionForm` (como já existe para fios soltos)
- [ ] Confirmação antes de sair com alterações não salvas no `SessionForm` / `StoryPlanManager` / `NpcManager`

---

## Qualidade / infra

- [ ] Testes automatizados (use cases + adapters in-memory; mocks para Firestore) — hoje só há o auto-teste manual de `projectSnapshot`
- [ ] CI (typecheck + lint + build + testes)

---

## Futuro (fora do plano atual)

- [ ] Suporte a múltiplas guilds / remover o vínculo hardcoded `MASTER_GUILD_ID`
- [ ] Upload de imagens/ícones (hoje os ícones são emojis em texto)
- [ ] Histórico/versionamento de sessões
