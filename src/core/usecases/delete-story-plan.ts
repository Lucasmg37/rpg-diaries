import { NotFoundError } from "../errors";
import type { Repositories } from "../ports";

/** Exclui um roteiro do mestre. */
export async function deleteStoryPlan(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  id: string,
): Promise<void> {
  const existing = await repos.storyPlans.getById(guildId, adventureId, id);
  if (!existing) {
    throw new NotFoundError(`Roteiro "${id}" não encontrado.`);
  }
  await repos.storyPlans.delete(guildId, adventureId, id);
}
