/**
 * LooseEnd — fio solto / gancho narrativo. Entidade única por Adventure.
 * Seu estado (resolved, descrição, categoria) é global à entidade — não varia
 * por sessão — por isso a Session apenas o referencia via `looseEndIds`.
 */
export interface LooseEnd {
  id: string;
  guildId: string;
  adventureId: string;
  title: string;
  category: string;
  description: string;
  color: string;
  icon: string;
  resolved: boolean;
}

export type CreateLooseEndInput = Omit<LooseEnd, "id">;

/** Patch parcial para atualizar um LooseEnd (não muda id/guild/adventure). */
export type UpdateLooseEndInput = Partial<
  Omit<LooseEnd, "id" | "guildId" | "adventureId">
>;
