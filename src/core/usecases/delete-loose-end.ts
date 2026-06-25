import { ConflictError } from "../errors";
import type { Repositories } from "../ports";

/** Exclui um fio solto — bloqueado se referenciado em alguma sessão. */
export async function deleteLooseEnd(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  id: string,
): Promise<void> {
  const sessions = await repos.sessions.listByAdventure(guildId, adventureId);
  const referencing = sessions.find((s) => s.looseEndIds.includes(id));
  if (referencing) {
    throw new ConflictError(
      `Fio solto não pode ser excluído — referenciado na sessão "${referencing.title}".`,
    );
  }

  await repos.looseEnds.delete(guildId, adventureId, id);
}
