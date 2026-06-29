import type { Session } from "../entities/session";
import type { Repositories } from "../ports";

/**
 * Reordena as entradas da timeline de uma sessão de acordo com a lista de
 * ids fornecida. Entradas existentes que não aparecerem em `entryIds`
 * mantêm sua ordem relativa, posicionadas após as reordenadas.
 */
export async function reorderSessionTimelineEntries(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  id: string,
  entryIds: string[],
): Promise<Session> {
  return repos.sessions.reorderTimelineEntries(guildId, adventureId, id, entryIds);
}
