import type { Adventure, UpdateAdventureInput } from "../entities/adventure";
import type { Repositories } from "../ports";

/** Atualiza nome/descrição/ordem de uma aventura. */
export async function updateAdventure(
  repos: Repositories,
  guildId: string,
  id: string,
  patch: UpdateAdventureInput,
): Promise<Adventure> {
  return repos.adventures.update(guildId, id, patch);
}
