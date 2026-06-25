import type { Repositories } from "../ports";

/** Reordena as aventuras da guilda: `orderedIds[i]` recebe `order = i + 1`. */
export async function reorderAdventures(
  repos: Repositories,
  guildId: string,
  orderedIds: string[],
): Promise<void> {
  await Promise.all(
    orderedIds.map((id, i) => repos.adventures.update(guildId, id, { order: i + 1 })),
  );
}
