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

---

## Fase 7 — Polimento e hardening

- [ ] Tratamento de erros consistente nas API routes (status codes, mensagens)
- [ ] Revisão final: nenhuma rota pública expõe `masterNotes` ou tokens
- [ ] README com instruções completas de setup, seed e deploy
- [ ] Rate limiting / proteção contra brute force no `POST /api/auth/login`
- [ ] Regras de segurança do Firestore (defesa em profundidade — o Admin SDK as ignora)

---

## Lacunas da gestão (Fase 5)

- [ ] **Delete** de sessão / aventureiro / fio solto (com guarda de integridade referencial — são referenciados entre si)
- [ ] CRUD de **aventuras** (hoje só via seed; não há `create-adventure`)
- [ ] Reordenação de sessões/aventuras (campo `order`/`number` editável por arraste)
- [ ] (Opcional) Criação inline de **aventureiro** dentro do `SessionForm` (como já existe para fios soltos)
- [ ] Confirmação antes de sair com alterações não salvas no `SessionForm`

---

## Deploy / operação

- [ ] Configurar **`DEPLOY_HOOK_URL`** (Vercel → Project Settings → Git → Deploy Hooks) — o botão Publicar já está pronto
- [ ] Trocar o **`MASTER_PASSWORD` de teste** (`mestre-teste-123`) por uma senha real
- [ ] Configurar as env vars na **Vercel (Production)**: `FIREBASE_*`, `MASTER_GUILD_ID`, `MASTER_PASSWORD`, `JWT_SECRET`, `DEPLOY_HOOK_URL`, `MCP_SERVICE_TOKEN`
- [ ] Validar o build da Vercel lendo o Firestore (env do Firebase no ambiente de build)

---

## Qualidade / infra

- [ ] Testes automatizados (use cases + adapters in-memory; mocks para Firestore)
- [ ] Configurar ESLint (ausente — `next build` hoje pula o lint)
- [ ] CI (typecheck + build + testes)

---

## Futuro (fora do plano atual)

- [ ] Suporte a múltiplas guilds / remover o vínculo hardcoded `MASTER_GUILD_ID`
- [ ] Upload de imagens/ícones (hoje os ícones são emojis em texto)
- [ ] Histórico/versionamento de sessões
