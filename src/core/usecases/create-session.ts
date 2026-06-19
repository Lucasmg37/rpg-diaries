import type { CreateSessionInput, Session } from "../entities/session";
import { ValidationError } from "../errors";
import type { Repositories } from "../ports";

/**
 * Cria uma sessão. Os `participants` já podem trazer o `sessionBadge`
 * contextual de cada aventureiro. Valida que os aventureiros e fios soltos
 * referenciados existem na mesma adventure.
 */
export async function createSession(
  repos: Repositories,
  input: CreateSessionInput,
): Promise<Session> {
  const adventurers = await repos.adventurers.listByAdventure(
    input.guildId,
    input.adventureId,
  );
  const validAdventurerIds = new Set(adventurers.map((a) => a.id));
  for (const p of input.participants) {
    if (!validAdventurerIds.has(p.adventurerId)) {
      throw new ValidationError(
        `Aventureiro "${p.adventurerId}" não pertence à adventure "${input.adventureId}".`,
      );
    }
  }

  const looseEnds = await repos.looseEnds.listByAdventure(
    input.guildId,
    input.adventureId,
  );
  const validLooseEndIds = new Set(looseEnds.map((l) => l.id));
  for (const id of input.looseEndIds) {
    if (!validLooseEndIds.has(id)) {
      throw new ValidationError(
        `Fio solto "${id}" não pertence à adventure "${input.adventureId}".`,
      );
    }
  }

  return repos.sessions.create(input);
}
