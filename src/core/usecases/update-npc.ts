import type { Npc, UpdateNpcInput } from "../entities/npc";
import type { Repositories } from "../ports";

/** Atualiza a identidade de um NPC (nome, descrição, stats, masterNotes...). */
export async function updateNpc(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  id: string,
  patch: UpdateNpcInput,
): Promise<Npc> {
  return repos.npcs.update(guildId, adventureId, id, patch);
}
