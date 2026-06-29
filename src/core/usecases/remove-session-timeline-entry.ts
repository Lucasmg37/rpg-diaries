import type { Session } from "../entities/session";
import type { Repositories } from "../ports";

/** Remove uma entrada da timeline de uma sessão pelo seu id. */
export async function removeSessionTimelineEntry(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  id: string,
  entryId: string,
): Promise<Session> {
  return repos.sessions.removeTimelineEntry(guildId, adventureId, id, entryId);
}
