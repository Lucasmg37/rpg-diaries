# Diário da Guilda

Sistema de publicação de diários de RPG. Páginas públicas geradas estaticamente
(SSG) via Next.js, domínio isolado por trás de _ports_ e persistência em
Firestore via _adapters_.

> **Estado atual:** Fases 1–3 implementadas (domínio, integração Firestore e
> páginas públicas). Admin, deploy hook e MCP (Fases 4–7) ainda não.

## Arquitetura

```
src/
  core/            # domínio puro — NÃO importa Firestore
    entities/      # Guild, Adventure, Session, SessionParticipant, Adventurer, LooseEnd + views
    ports/         # interfaces de repositório
    usecases/      # getFullGuild/Adventure/Session, create/update*
  adapters/
    in-memory/     # adapter em memória (Fase 1 / fallback de dev)
    firestore/     # adapter Firestore (Admin SDK)
    config/        # repository-factory (ÚNICO ponto que decide o adapter) + master-config
  app/             # páginas Next.js (App Router, SSG)
  components/public # TagBadge, PartyCard, TimelineEntryItem, AdventurerCard, LooseEndCard
  lib/             # sample-data, guild-data (loader cacheado)
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
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Gera as páginas estáticas (Fase 3) |
| `npm run typecheck` | Checagem de tipos |

## Variáveis de ambiente

Veja `.env.example`. Para as Fases 1–3 só importam (opcionalmente):

```bash
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=    # uma linha, com \n literais
MASTER_GUILD_ID=guild-aurora
```
