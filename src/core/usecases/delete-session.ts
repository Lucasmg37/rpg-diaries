import { NotFoundError } from "../errors";
import type { Repositories } from "../ports";

/** Exclui uma sessão. */
export async function deleteSession(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  id: string,
): Promise<void> {
  const existing = await repos.sessions.getById(guildId, adventureId, id);
  if (!existing) {
    throw new NotFoundError(`Sessão "${id}" não encontrada.`);
  }
  await repos.sessions.delete(guildId, adventureId, id);
}
