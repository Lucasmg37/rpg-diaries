import type { Session } from "../entities/session";
import type { SessionParticipant } from "../entities/session-participant";
import type { Repositories } from "../ports";

/**
 * Insere ou atualiza um participante de uma sessão (chave: `adventurerId`),
 * sem exigir o array `participants` inteiro.
 */
export async function upsertSessionParticipant(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  id: string,
  participant: SessionParticipant,
): Promise<Session> {
  return repos.sessions.upsertParticipant(guildId, adventureId, id, participant);
}
