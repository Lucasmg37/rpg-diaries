import type { Scene, StoryPlan } from "../entities/story-plan";
import type { Repositories } from "../ports";

/**
 * Insere ou atualiza uma única cena de um roteiro, sem exigir o array
 * `scenes` inteiro. `position` controla onde a cena entra (0-based); se
 * omitido, cenas novas vão para o fim e cenas existentes mantêm o lugar.
 */
export async function upsertStoryPlanScene(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  id: string,
  scene: Scene,
  position?: number,
): Promise<StoryPlan> {
  return repos.storyPlans.upsertScene(guildId, adventureId, id, scene, position);
}
