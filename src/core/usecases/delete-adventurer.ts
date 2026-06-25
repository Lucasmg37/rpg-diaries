import { ConflictError } from "../errors";
import type { Repositories } from "../ports";

/** Exclui um aventureiro — bloqueado se referenciado em alguma sessão. */
export async function deleteAdventurer(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  id: string,
): Promise<void> {
  const sessions = await repos.sessions.listByAdventure(guildId, adventureId);
  const referencing = sessions.find((s) =>
    s.participants.some((p) => p.adventurerId === id),
  );
  if (referencing) {
    throw new ConflictError(
      `Aventureiro não pode ser excluído — participa da sessão "${referencing.title}".`,
    );
  }

  await repos.adventurers.delete(guildId, adventureId, id);
}
