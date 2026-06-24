import type { AdventurerSnapshot } from "./adventurer-event";

/**
 * Adventurer — entidade única por Adventure, reaproveitada por várias sessões.
 * Os atributos aqui são "permanentes" do personagem (identidade). O badge
 * contextual de cada sessão NÃO vive aqui — vive em SessionParticipant.
 *
 * `className` em vez de `class` porque "class" é palavra reservada.
 *
 * Fase 2 do event sourcing (concluída): `level`/`status` NÃO existem mais
 * como campos editáveis — todo aventureiro tem, desde a criação, um
 * `snapshot` derivado da timeline de eventos
 * (core/usecases/project-snapshot.ts), nunca editado à mão. Use
 * `adventurerLevel(a)`/`adventurerStatusLabel(a)` (lib/adventurer-view.ts)
 * para exibição.
 */
export interface Adventurer {
  id: string;
  guildId: string;
  adventureId: string;
  name: string;
  className: string;
  icon: string;
  background: string;
  /** Motivação pessoal do personagem (ex.: "Vingar a família"). Opcional. */
  goal?: string;
  /** Link externo para a ficha completa. */
  sheetUrl: string;
  /** Projeção derivada da timeline de eventos — sempre presente após a criação. */
  snapshot?: AdventurerSnapshot;
}

/** Input de criação de identidade; o snapshot inicial é gerado pelo usecase (evento `joined`). */
export type CreateAdventurerInput = Omit<Adventurer, "id" | "snapshot">;

/** Patch parcial para atualizar a identidade de um Adventurer (não muda id/guild/adventure/snapshot). */
export type UpdateAdventurerInput = Partial<
  Omit<Adventurer, "id" | "guildId" | "adventureId" | "snapshot">
>;

/**
 * Patch de baixo nível usado pelo repositório — inclui `snapshot`. Só
 * `rebuildSnapshot`/`appendAdventurerEvent` devem gravar `snapshot`; nenhum
 * caminho voltado a humanos (admin, MCP) deve aceitar esse campo como input.
 */
export type AdventurerRepositoryPatch = Partial<
  Omit<Adventurer, "id" | "guildId" | "adventureId">
>;
