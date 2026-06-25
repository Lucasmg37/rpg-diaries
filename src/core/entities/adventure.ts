/**
 * Adventure — uma campanha dentro de uma Guild.
 * Contém sessions, adventurers e looseEnds (subcoleções no Firestore).
 */
export interface Adventure {
  id: string;
  guildId: string;
  name: string;
  slug: string;
  description: string;
  order: number;
  createdAt: Date;
}

export type CreateAdventureInput = Omit<Adventure, "id" | "createdAt">;

export type UpdateAdventureInput = Partial<
  Omit<Adventure, "id" | "guildId" | "createdAt">
>;
