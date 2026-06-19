import type {
  StoryPlan,
  UpdateStoryPlanInput,
} from "../entities/story-plan";
import { NotFoundError } from "../errors";
import type { Repositories } from "../ports";

/** Atualiza um roteiro do mestre (campos parciais). */
export async function updateStoryPlan(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  id: string,
  patch: UpdateStoryPlanInput,
): Promise<StoryPlan> {
  const existing = await repos.storyPlans.getById(guildId, adventureId, id);
  if (!existing) {
    throw new NotFoundError(`Roteiro "${id}" não encontrado.`);
  }
  return repos.storyPlans.update(guildId, adventureId, id, patch);
}
