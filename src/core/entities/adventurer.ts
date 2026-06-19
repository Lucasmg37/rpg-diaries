/**
 * Adventurer — entidade única por Adventure, reaproveitada por várias sessões.
 * Os atributos aqui são "permanentes" do personagem. O badge contextual de cada
 * sessão NÃO vive aqui — vive em SessionParticipant.
 *
 * `className` em vez de `class` porque "class" é palavra reservada.
 */
export interface Adventurer {
  id: string;
  guildId: string;
  adventureId: string;
  name: string;
  className: string;
  icon: string;
  level: number;
  background: string;
  /** Status permanente (ex.: "Ativo", "Morto") — não o badge da sessão. */
  status: string;
  /** Link externo para a ficha completa. */
  sheetUrl: string;
}

export type CreateAdventurerInput = Omit<Adventurer, "id">;

/** Patch parcial para atualizar um Adventurer (não muda id/guild/adventure). */
export type UpdateAdventurerInput = Partial<
  Omit<Adventurer, "id" | "guildId" | "adventureId">
>;
