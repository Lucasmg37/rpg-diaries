/**
 * StoryPlan — Roteiro do Mestre. Documento de preparação/condução de uma
 * narrativa (cenas, pistas, testes, segredos, riscos e escolhas do grupo),
 * modelado a partir do HTML de referência (cena_investigacao_bibliotecaria.html).
 *
 * É material SIGILOSO, de uso exclusivo do mestre — diferente da Session, que é
 * o diário público pós-jogo. Por isso NUNCA é incluído em getFullGuild /
 * getFullAdventure nem em páginas públicas, e o acesso via MCP exige token.
 *
 * `guildId` e `adventureId` são denormalizados para reconstruir o caminho no
 * Firestore, no mesmo padrão de Session. Todo roteiro é vinculado a uma Adventure.
 */

/**
 * Bloco dentro de uma cena. União discriminada por `type`, espelhando os
 * elementos visuais do documento de referência:
 * - `clue`    → .clue (texto narrativo / pista)
 * - `test`    → .test-box (teste de personagem/grupo ou combate)
 * - `secret`  → .secret-box (segredo do mestre, informação oculta)
 * - `danger`  → .danger-box (risco / consequência)
 * - `choices` → .choice-grid (decisões possíveis do grupo)
 */
export type SceneBlock =
  | { type: "clue"; body: string }
  | { type: "test"; variant: "test" | "combat"; tag: string; body: string }
  | { type: "secret"; label: string; body: string }
  | { type: "danger"; label: string; body: string }
  | { type: "choices"; choices: SceneChoice[] };

/** Uma opção de decisão dentro de um bloco `choices`. */
export interface SceneChoice {
  title: string;
  body: string;
}

/** Cena do roteiro (.loc-block): cabeçalho + lista de blocos. */
export interface Scene {
  /** Id local, estável, usado para vincular notas vivas a esta cena. */
  id: string;
  icon: string;
  title: string;
  meta: string;
  blocks: SceneBlock[];
}

/** Banner de lore no topo do documento (.lore-banner). */
export interface LoreBanner {
  label: string;
  body: string;
  tags: string[];
}

/**
 * Nota lançada pelo mestre DURANTE o jogo, sobre as cenas/decisões tomadas
 * pelo grupo. Append-only; cada nota tem id e timestamp próprios.
 */
export interface StoryNote {
  id: string;
  body: string;
  /** Vincula a nota a uma cena específica do roteiro (opcional). */
  sceneId?: string;
  createdAt: Date;
}

export interface StoryPlan {
  id: string;
  guildId: string;
  adventureId: string;
  /** Título do documento (.doc-title). */
  title: string;
  /** Sobrelinha do cabeçalho (.doc-eyebrow). */
  eyebrow: string;
  /** Subtítulo (.doc-sub). */
  subtitle: string;
  loreBanner?: LoreBanner;
  scenes: Scene[];
  /** Nota de recompensa no rodapé (.reward-note). */
  reward?: string;
  /** Notas do mestre lançadas durante o jogo. */
  liveNotes: StoryNote[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateStoryPlanInput = Omit<
  StoryPlan,
  "id" | "liveNotes" | "createdAt" | "updatedAt"
>;

/** Patch parcial para atualizar um StoryPlan (não muda id/guild/adventure/notas). */
export type UpdateStoryPlanInput = Partial<
  Omit<
    StoryPlan,
    "id" | "guildId" | "adventureId" | "liveNotes" | "createdAt" | "updatedAt"
  >
>;

/** Entrada para lançar uma nota viva (id e createdAt são gerados no domínio). */
export type CreateStoryNoteInput = Omit<StoryNote, "id" | "createdAt">;
