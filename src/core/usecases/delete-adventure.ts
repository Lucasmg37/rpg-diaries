import { ConflictError } from "../errors";
import type { Repositories } from "../ports";

/**
 * Exclui uma aventura — bloqueado se ela tiver qualquer sessão, aventureiro,
 * fio solto, roteiro ou NPC/Boss cadastrado (todos vivem como subcoleções
 * dela; cascade automático seria fácil de disparar por acidente e perder
 * histórico de campanha).
 */
export async function deleteAdventure(
  repos: Repositories,
  guildId: string,
  id: string,
): Promise<void> {
  const [sessions, adventurers, looseEnds, storyPlans, npcs] = await Promise.all([
    repos.sessions.listByAdventure(guildId, id),
    repos.adventurers.listByAdventure(guildId, id),
    repos.looseEnds.listByAdventure(guildId, id),
    repos.storyPlans.listByAdventure(guildId, id),
    repos.npcs.listByAdventure(guildId, id),
  ]);

  if (sessions.length || adventurers.length || looseEnds.length || storyPlans.length || npcs.length) {
    throw new ConflictError(
      "Aventura não pode ser excluída — ela ainda tem sessões, aventureiros, fios soltos, roteiros ou NPCs/Bosses cadastrados.",
    );
  }

  await repos.adventures.delete(guildId, id);
}
