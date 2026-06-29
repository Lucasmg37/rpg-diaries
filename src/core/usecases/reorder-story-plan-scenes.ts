import type { StoryPlan } from "../entities/story-plan";
import type { Repositories } from "../ports";

/**
 * Reordena as cenas de um roteiro de acordo com a lista de ids fornecida.
 * Cenas existentes que não aparecerem em `sceneIds` mantêm sua ordem
 * relativa, posicionadas após as reordenadas.
 */
export async function reorderStoryPlanScenes(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  id: string,
  sceneIds: string[],
): Promise<StoryPlan> {
  return repos.storyPlans.reorderScenes(guildId, adventureId, id, sceneIds);
}
