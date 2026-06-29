import type { Session, TimelineEntry } from "../entities/session";
import type { Repositories } from "../ports";

/**
 * Insere ou atualiza uma única entrada da timeline de uma sessão, sem
 * exigir o array `timeline` inteiro. `position` controla onde a entrada
 * entra (0-based); se omitido, entradas novas vão para o fim.
 */
export async function upsertSessionTimelineEntry(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  id: string,
  entry: TimelineEntry,
  position?: number,
): Promise<Session> {
  return repos.sessions.upsertTimelineEntry(
    guildId,
    adventureId,
    id,
    entry,
    position,
  );
}
