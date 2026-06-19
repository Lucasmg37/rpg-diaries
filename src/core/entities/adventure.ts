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
