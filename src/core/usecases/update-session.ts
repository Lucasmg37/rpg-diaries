import type { Session, UpdateSessionInput } from "../entities/session";
import { NotFoundError, ValidationError } from "../errors";
import type { Repositories } from "../ports";

/**
 * Atualiza uma sessão existente. Permite, por exemplo, alterar apenas o
 * `sessionBadge` de um participante (passando o array `participants` completo)
 * sem reescrever o resto da sessão.
 */
export async function updateSession(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  sessionId: string,
  patch: UpdateSessionInput,
): Promise<Session> {
  const existing = await repos.sessions.getById(
    guildId,
    adventureId,
    sessionId,
  );
  if (!existing) {
    throw new NotFoundError(`Sessão "${sessionId}" não encontrada.`);
  }

  if (patch.participants) {
    const adventurers = await repos.adventurers.listByAdventure(
      guildId,
      adventureId,
    );
    const validAdventurerIds = new Set(adventurers.map((a) => a.id));
    for (const p of patch.participants) {
      if (!validAdventurerIds.has(p.adventurerId)) {
        throw new ValidationError(
          `Aventureiro "${p.adventurerId}" não pertence à adventure "${adventureId}".`,
        );
      }
    }
  }

  return repos.sessions.update(guildId, adventureId, sessionId, patch);
}
