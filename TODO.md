# TODO — Diário da Guilda

Funcionalidades pendentes. **Fases 1–6 concluídas** (domínio, Firestore, páginas
públicas SSG, autenticação do Mestre, área de gestão, servidor MCP, roteiros do
mestre com notas ao vivo). O que falta:

---

## Fase 7 — Polimento e hardening

- [ ] ~~Rate limiting no login~~ — **despriorizado**: auth será migrada para o Firebase
- [ ] Regras de segurança do Firestore (deny-all; defesa em profundidade — o Admin SDK as ignora)

---

## Lacunas da gestão

- [ ] **Delete** de sessão / aventureiro / fio solto / roteiro do mestre (com guarda de integridade referencial — são referenciados entre si)
- [ ] CRUD de **aventuras** (hoje só via seed; não há `create-adventure`)
- [ ] Reordenação de sessões/aventuras/roteiros (campo `order`/`number` editável por arraste)
- [ ] (Opcional) Criação inline de **aventureiro** dentro do `SessionForm` (como já existe para fios soltos)
- [ ] Confirmação antes de sair com alterações não salvas no `SessionForm` / `StoryPlanManager`

---

## Qualidade / infra

- [ ] Testes automatizados (use cases + adapters in-memory; mocks para Firestore)
- [ ] CI (typecheck + lint + build + testes)

---

## Futuro (fora do plano atual)

- [ ] Suporte a múltiplas guilds / remover o vínculo hardcoded `MASTER_GUILD_ID`
- [ ] Upload de imagens/ícones (hoje os ícones são emojis em texto)
- [ ] Histórico/versionamento de sessões
