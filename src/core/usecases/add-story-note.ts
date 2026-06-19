import type {
  CreateStoryNoteInput,
  StoryPlan,
} from "../entities/story-plan";
import { NotFoundError, ValidationError } from "../errors";
import type { Repositories } from "../ports";

/**
 * Lança uma nota viva no roteiro (durante o jogo). Valida o roteiro e, quando a
 * nota referencia uma cena, que a cena exista nele.
 */
export async function addStoryNote(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  storyPlanId: string,
  note: CreateStoryNoteInput,
): Promise<StoryPlan> {
  const plan = await repos.storyPlans.getById(guildId, adventureId, storyPlanId);
  if (!plan) {
    throw new NotFoundError(`Roteiro "${storyPlanId}" não encontrado.`);
  }
  if (note.sceneId && !plan.scenes.some((s) => s.id === note.sceneId)) {
    throw new ValidationError(
      `Cena "${note.sceneId}" não pertence ao roteiro "${storyPlanId}".`,
    );
  }
  return repos.storyPlans.addNote(guildId, adventureId, storyPlanId, note);
}
