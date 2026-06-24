import type { Adventure } from "../entities/adventure";
import type { FullAdventure } from "../entities/views";
import type { Repositories } from "../ports";
import {
  resolveFullSession,
  type GetFullSessionOptions,
} from "./get-full-session";

/**
 * Monta uma FullAdventure a partir de uma Adventure JÁ CARREGADA: busca sessões,
 * elenco e fios soltos (uma consulta por subcoleção) e resolve cada sessão em
 * memória, sem refetch por id.
 */
export async function buildFullAdventure(
  repos: Repositories,
  adventure: Adventure,
  options: GetFullSessionOptions = {},
): Promise<FullAdventure> {
  const { guildId, id: adventureId } = adventure;

  const [sessions, adventurers, looseEnds, adventurerEvents] =
    await Promise.all([
      repos.sessions.listByAdventure(guildId, adventureId),
      repos.adventurers.listByAdventure(guildId, adventureId),
      repos.looseEnds.listByAdventure(guildId, adventureId),
      repos.adventurerEvents.listEvents(guildId, adventureId),
    ]);

  const resolvedSessions = sessions
    .map((s) =>
      resolveFullSession(s, adventurers, looseEnds, options, adventurerEvents),
    )
    .sort((a, b) => a.number - b.number);

  return { adventure, sessions: resolvedSessions, adventurers, looseEnds };
}

/**
 * Resolve uma Adventure completa pelo seu caminho (guild → adventure).
 */
export async function getFullAdventure(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  options: GetFullSessionOptions = {},
): Promise<FullAdventure | null> {
  const adventure = await repos.adventures.getById(guildId, adventureId);
  if (!adventure) return null;
  return buildFullAdventure(repos, adventure, options);
}
