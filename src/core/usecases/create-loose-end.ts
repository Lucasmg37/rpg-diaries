import type { CreateLooseEndInput, LooseEnd } from "../entities/loose-end";
import type { Repositories } from "../ports";

/** Cria um fio solto na adventure. */
export async function createLooseEnd(
  repos: Repositories,
  input: CreateLooseEndInput,
): Promise<LooseEnd> {
  const adventure = await repos.adventures.getById(
    input.guildId,
    input.adventureId,
  );
  if (!adventure) {
    throw new Error(`Adventure "${input.adventureId}" não encontrada.`);
  }
  return repos.looseEnds.create(input);
}
