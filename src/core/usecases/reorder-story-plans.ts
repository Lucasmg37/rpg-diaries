import type { Repositories } from "../ports";

/** Reordena os roteiros de uma aventura: `orderedIds[i]` recebe `order = i + 1`. */
export async function reorderStoryPlans(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  orderedIds: string[],
): Promise<void> {
  await Promise.all(
    orderedIds.map((id, i) =>
      repos.storyPlans.update(guildId, adventureId, id, { order: i + 1 }),
    ),
  );
}
