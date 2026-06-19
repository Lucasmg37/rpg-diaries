import type { LooseEnd, UpdateLooseEndInput } from "../entities/loose-end";
import type { Repositories } from "../ports";

/** Atualiza um fio solto (ex.: marcar como resolvido, editar descrição). */
export async function updateLooseEnd(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  id: string,
  patch: UpdateLooseEndInput,
): Promise<LooseEnd> {
  return repos.looseEnds.update(guildId, adventureId, id, patch);
}
