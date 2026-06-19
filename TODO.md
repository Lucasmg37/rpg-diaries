# TODO — Diário da Guilda

Funcionalidades pendentes. **Fases 1–6 concluídas** (domínio, Firestore, páginas
públicas SSG, autenticação do Mestre, área de gestão, servidor MCP). O que falta:

---

## Fase 6 — Servidor MCP ✅ (concluída)

- [x] `src/app/api/mcp/route.ts` — JSON-RPC 2.0 / Streamable HTTP (implementado direto; o transporte do SDK não encaixa nos route handlers fetch do Next)
- [x] Tool `getGuildData(guildId)` — leitura completa (sem `masterNotes`)
- [x] Tool `listSessions(adventureId)`
- [x] Tool `createSession(adventureId, data)` — exige `MCP_SERVICE_TOKEN`; participantes com badge contextual
- [x] Tool `updateSession(sessionId, data)` — exige `MCP_SERVICE_TOKEN`; patch parcial (ex.: só o `sessionBadge`)
- [x] `src/lib/mcp-auth.ts` — valida `MCP_SERVICE_TOKEN` nas escritas; leitura liberada
- [x] `MCP_SERVICE_TOKEN` de teste no `.env.local` — **falta configurar na Vercel**
- [x] **Critério atendido:** verificado via JSON-RPC (initialize, tools/list, getGuildData, create/updateSession)

### MCP — melhorias

- [x] Melhorar os esquemas de **saída** dos serviços MCP (definir `outputSchema`/`structuredContent` das tools, em vez de só texto JSON)
- [x] Permitir criar **aventureiros** e **fios soltos** via MCP (novas tools `createAdventurer` / `createLooseEnd`, escrita com `MCP_SERVICE_TOKEN`)

---

## Fase 7 — Polimento e hardening

- [x] Tratamento de erros consistente nas API routes — `NotFoundError`/`ValidationError` (core) → `apiError` mapeia 404/400/500
- [x] Revisão final: nenhuma rota pública expõe `masterNotes` ou tokens (auditado)
- [x] README com instruções de setup, seed, deploy e MCP
- [ ] ~~Rate limiting no login~~ — **despriorizado**: auth será migrada para o Firebase
- [ ] Regras de segurança do Firestore (deny-all; defesa em profundidade — o Admin SDK as ignora)

---

## Lacunas da gestão (Fase 5)

- [ ] **Delete** de sessão / aventureiro / fio solto (com guarda de integridade referencial — são referenciados entre si)
- [ ] CRUD de **aventuras** (hoje só via seed; não há `create-adventure`)
- [ ] Reordenação de sessões/aventuras (campo `order`/`number` editável por arraste)
- [ ] (Opcional) Criação inline de **aventureiro** dentro do `SessionForm` (como já existe para fios soltos)
- [ ] Confirmação antes de sair com alterações não salvas no `SessionForm`

---

## Deploy / operação

- [x] Configurar **`DEPLOY_HOOK_URL`** (Vercel Deploy Hook) — configurado e funcionando
- [x] Configurar env vars na **Vercel (Production)** — feito (MCP validado em prod)
- [x] Trocar o **`MASTER_PASSWORD` de teste** (`mestre-teste-123`) por uma senha real (relevante até a migração da auth para o Firebase)

---

## Qualidade / infra

- [x] Configurar ESLint (`eslint.config.mjs` flat + `npm run lint`; roda também no `next build`)
- [ ] Testes automatizados (use cases + adapters in-memory; mocks para Firestore)
- [ ] CI (typecheck + lint + build + testes)

---

## Futuro (fora do plano atual)

- [ ] Suporte a múltiplas guilds / remover o vínculo hardcoded `MASTER_GUILD_ID`
- [ ] Upload de imagens/ícones (hoje os ícones são emojis em texto)
- [ ] Histórico/versionamento de sessões
