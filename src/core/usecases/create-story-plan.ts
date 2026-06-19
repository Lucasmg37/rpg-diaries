import type {
  CreateStoryPlanInput,
  StoryPlan,
} from "../entities/story-plan";
import { NotFoundError } from "../errors";
import type { Repositories } from "../ports";

/** Cria um roteiro do mestre vinculado a uma adventure. */
export async function createStoryPlan(
  repos: Repositories,
  input: CreateStoryPlanInput,
): Promise<StoryPlan> {
  const adventure = await repos.adventures.getById(
    input.guildId,
    input.adventureId,
  );
  if (!adventure) {
    throw new NotFoundError(`Adventure "${input.adventureId}" não encontrada.`);
  }
  return repos.storyPlans.create(input);
}
