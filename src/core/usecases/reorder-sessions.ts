import type { Repositories } from "../ports";

/** Reordena as sessões de uma aventura: `orderedIds[i]` recebe `number = i + 1`. */
export async function reorderSessions(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  orderedIds: string[],
): Promise<void> {
  await Promise.all(
    orderedIds.map((id, i) =>
      repos.sessions.update(guildId, adventureId, id, { number: i + 1 }),
    ),
  );
}
