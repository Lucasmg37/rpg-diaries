import type { Adventurer } from "../entities/adventurer";
import type { LooseEnd } from "../entities/loose-end";
import type { Session } from "../entities/session";
import type { FullSession, ResolvedParticipant } from "../entities/views";
import type { Repositories } from "../ports";

export interface GetFullSessionOptions {
  /**
   * Inclui `masterNotes` no resultado. Default: false.
   * As páginas públicas SEMPRE chamam sem esta opção, garantindo que as notas
   * do mestre nunca cheguem ao payload renderizado publicamente.
   */
  includeMasterNotes?: boolean;
}

/**
 * Join PURO (sem acesso a repositório): resolve uma Session já carregada contra
 * as listas (já carregadas) de aventureiros e fios soltos da mesma adventure.
 * - cada `participants[].adventurerId` vira o Adventurer fixo + sessionBadge/
 *   sessionState/sessionNote (que vêm da própria Session);
 * - cada `looseEndIds` vira o LooseEnd completo;
 * - `masterNotes` só é incluído quando `includeMasterNotes` é true.
 */
export function resolveFullSession(
  session: Session,
  adventurers: Adventurer[],
  looseEnds: LooseEnd[],
  options: GetFullSessionOptions = {},
): FullSession {
  const adventurersById = new Map<string, Adventurer>(
    adventurers.map((a) => [a.id, a]),
  );
  const looseEndsById = new Map<string, LooseEnd>(
    looseEnds.map((l) => [l.id, l]),
  );

  const participants: ResolvedParticipant[] = [];
  for (const p of session.participants) {
    const adventurer = adventurersById.get(p.adventurerId);
    if (!adventurer) continue;
    participants.push({
      adventurer,
      sessionBadge: p.sessionBadge,
      sessionState: p.sessionState,
      sessionNote: p.sessionNote,
    });
  }

  const resolvedLooseEnds: LooseEnd[] = [];
  for (const id of session.looseEndIds) {
    const looseEnd = looseEndsById.get(id);
    if (looseEnd) resolvedLooseEnds.push(looseEnd);
  }

  return {
    id: session.id,
    guildId: session.guildId,
    adventureId: session.adventureId,
    title: session.title,
    number: session.number,
    icon: session.icon,
    summary: session.summary,
    timeline: session.timeline,
    tags: session.tags,
    ...(options.includeMasterNotes
      ? { masterNotes: session.masterNotes }
      : {}),
    participants,
    looseEnds: resolvedLooseEnds,
    closing: session.closing,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

/**
 * Busca e resolve uma Session pelo seu caminho (guild → adventure → session).
 */
export async function getFullSession(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  sessionId: string,
  options: GetFullSessionOptions = {},
): Promise<FullSession | null> {
  const session = await repos.sessions.getById(
    guildId,
    adventureId,
    sessionId,
  );
  if (!session) return null;

  const [adventurers, looseEnds] = await Promise.all([
    repos.adventurers.listByAdventure(guildId, adventureId),
    repos.looseEnds.listByAdventure(guildId, adventureId),
  ]);

  return resolveFullSession(session, adventurers, looseEnds, options);
}
