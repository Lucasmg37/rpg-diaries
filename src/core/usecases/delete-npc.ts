import { ConflictError } from "../errors";
import type { Repositories } from "../ports";

/**
 * Exclui um NPC/Boss — bloqueado se referenciado em alguma sessão ou em
 * cena de roteiro do mestre.
 */
export async function deleteNpc(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  id: string,
): Promise<void> {
  const sessions = await repos.sessions.listByAdventure(guildId, adventureId);
  const referencingSession = sessions.find((s) => s.npcIds?.includes(id));
  if (referencingSession) {
    throw new ConflictError(
      `NPC não pode ser excluído — referenciado na sessão "${referencingSession.title}".`,
    );
  }

  const storyPlans = await repos.storyPlans.listByAdventure(guildId, adventureId);
  const referencingPlan = storyPlans.find((p) =>
    p.scenes.some((scene) => scene.npcIds?.includes(id)),
  );
  if (referencingPlan) {
    throw new ConflictError(
      `NPC não pode ser excluído — referenciado no roteiro "${referencingPlan.title}".`,
    );
  }

  await repos.npcs.delete(guildId, adventureId, id);
}
