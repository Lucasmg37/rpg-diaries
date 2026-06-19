import type { StoryPlan } from "../entities/story-plan";
import type { Repositories } from "../ports";

/** Lista os roteiros do mestre de uma adventure, ordenados por `order`. */
export async function getStoryPlans(
  repos: Repositories,
  guildId: string,
  adventureId: string,
): Promise<StoryPlan[]> {
  const plans = await repos.storyPlans.listByAdventure(guildId, adventureId);
  return [...plans].sort((a, b) => a.order - b.order);
}

/** Obtém um roteiro específico (ou null). */
export async function getStoryPlan(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  id: string,
): Promise<StoryPlan | null> {
  return repos.storyPlans.getById(guildId, adventureId, id);
}
