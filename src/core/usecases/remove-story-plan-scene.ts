import type { StoryPlan } from "../entities/story-plan";
import type { Repositories } from "../ports";

/** Remove uma cena de um roteiro pelo seu id. */
export async function removeStoryPlanScene(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  id: string,
  sceneId: string,
): Promise<StoryPlan> {
  return repos.storyPlans.removeScene(guildId, adventureId, id, sceneId);
}
