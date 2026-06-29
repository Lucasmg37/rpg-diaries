import type { Session } from "../entities/session";
import type { Repositories } from "../ports";

/** Remove um participante de uma sessão pelo `adventurerId`. */
export async function removeSessionParticipant(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  id: string,
  adventurerId: string,
): Promise<Session> {
  return repos.sessions.removeParticipant(guildId, adventureId, id, adventurerId);
}
