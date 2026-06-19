import type {
  Adventurer,
  UpdateAdventurerInput,
} from "../entities/adventurer";
import type { Repositories } from "../ports";

/** Atualiza um aventureiro (atributos permanentes; ex.: sheetUrl, status). */
export async function updateAdventurer(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  id: string,
  patch: UpdateAdventurerInput,
): Promise<Adventurer> {
  return repos.adventurers.update(guildId, adventureId, id, patch);
}
