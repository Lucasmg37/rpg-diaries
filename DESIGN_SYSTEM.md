# Mini Design System — Diário da Guilda

Linguagem visual extraída do diário de referência
([reference/diario-referencia.html](reference/diario-referencia.html)).
Vitrine ao vivo: **`/design-system`** (link no rodapé do site).

## Tokens

Fonte de verdade dupla, sempre em sincronia:

- **Tailwind** ([tailwind.config.ts](tailwind.config.ts)) — utilitários (`text-guild-gold`, `bg-guild-bg2`, `border-guild-border`…).
- **Runtime** ([src/components/ui/tokens.ts](src/components/ui/tokens.ts)) — hex em JS para cores dinâmicas vindas de dados (tags, fios soltos) e para a vitrine.

### Cores

| Token | Hex | Uso |
|---|---|---|
| `bg1` | `#1a0a00` | Fundo (topo do gradiente) |
| `bg2` | `#2d1200` | Fundo / superfície de painel |
| `gold` | `#e8c46a` | Dourado principal — títulos, destaque |
| `goldsoft` | `#d4a04a` | Dourado vivo — links, CTA |
| `muted` | `#a07a40` | Texto de corpo / apagado |
| `border` | `#8b5e1a` | Bordas e divisórias |
| `red` | `#e07050` | Acento — perigo / perda |
| `purple` | `#9a60d8` | Acento — magia / mistério |
| `green` | `#4a7d3e` | Acento — novo / cura |
| `danger` | `#8b3a1a` | Borda de estado "suspeito" |

Fundo do `body`: `linear-gradient(135deg, #1a0a00, #2d1200 40%, #1a0a00)` fixo.

Acentos de **dados** (cor escolhida pelo Master por tag/fio solto): `purple`, `amber` (= `goldsoft`), `red`, `gray` (= `muted`). Pílulas tingem fundo (~10%) e borda (~40%) automaticamente a partir do hex.

### Tipografia

- **Heading:** Cinzel (400/600/700) — `font-heading`.
- **Body:** Crimson Pro — `font-body` (padrão do `body`).
- **Base:** 15px / line-height 1.65.
- **Eyebrow:** 10px, maiúsculas, `tracking` 2px, cor `border`.

Importadas via `@import` do Google Fonts em [globals.css](src/app/globals.css).

## Classes utilitárias (globals.css)

- `.panel` — superfície de card (borda dourada + fundo translúcido).
- `.eyebrow` — rótulo pequeno em maiúsculas.
- `.ornament` — divisória com símbolo central entre dois filetes.
- `.callout` — caixa de citação/destaque em itálico.

## Primitivas ([src/components/ui](src/components/ui))

| Componente | Papel |
|---|---|
| `Panel` | Contêiner base do tema |
| `Eyebrow` | Rótulo em maiúsculas |
| `SectionHeading` | Eyebrow + título de seção (centralizado) |
| `Ornament` | Divisória decorativa |
| `Pill` | Pílula colorida a partir de um hex (base de `TagBadge`, `LooseEndTag`) |
| `Stat` | Número de destaque + rótulo |
| `Callout` | Caixa de destaque em itálico |
| `Quote` | Nota de encerramento (citação + tagline) |
| `Button` | Botão do tema — variantes `primary` e `ghost` |
| `Field` | Campo de formulário rotulado (label + input) |
| `TextArea` | Campo de texto multilinha rotulado |
| `Select` | Campo de seleção rotulado |
| `Alert` | Caixa de mensagem — tons `error` e `info` |

### Componentes de domínio que consomem as primitivas

- `TagBadge`, `LooseEndTag` → `Pill`
- `TimelineEntryItem` → `Callout`
- `PartyCard` → estados visuais por sessão (`normal` / `suspicious` / `fallen` / `new`)
- `AdventurerCard`, páginas → `Panel`, `SectionHeading`, `Stat`, `Quote`, `Ornament`
- `/admin/login` → `Field`, `Alert`, `Button` (primary); `/admin` (barra) → `Button` (ghost)
- `/admin/management/*` (`SessionForm`, `AdventurerManager`, `LooseEndManager`) →
  `Field`, `TextArea`, `Select`, `Button`, `Alert`, `Panel`, `Eyebrow`
- Home (banner "dados de exemplo") → `Alert` (info)

## Estados do Party Card

Contextuais por sessão (campo `sessionState` em `SessionParticipant`):

| Estado | Aparência |
|---|---|
| `normal` | borda dourada padrão |
| `suspicious` | borda vermelha (`danger`) + fundo avermelhado |
| `fallen` | esmaecido (opacidade) |
| `new` | borda verde + fundo esverdeado |
