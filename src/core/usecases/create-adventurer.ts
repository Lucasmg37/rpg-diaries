import type {
  Adventurer,
  CreateAdventurerInput,
} from "../entities/adventurer";
import { NotFoundError } from "../errors";
import type { Repositories } from "../ports";
import { rebuildSnapshot } from "./append-adventurer-event";

/**
 * Cria um aventureiro na adventure e grava o evento `joined` que dá origem ao
 * seu snapshot — desde a Fase 2 do event sourcing, todo aventureiro tem
 * snapshot desde a criação; não existe mais aventureiro "sem timeline".
 *
 * `initialLevel` (padrão 1) é só o nível de partida do evento `joined`; não é
 * um campo persistido na identidade do aventureiro.
 */
export async function createAdventurer(
  repos: Repositories,
  input: CreateAdventurerInput,
  initialLevel = 1,
): Promise<Adventurer> {
  const adventure = await repos.adventures.getById(
    input.guildId,
    input.adventureId,
  );
  if (!adventure) {
    throw new NotFoundError(`Adventure "${input.adventureId}" não encontrada.`);
  }

  const created = await repos.adventurers.create(input);

  await repos.adventurerEvents.appendEvent(input.guildId, input.adventureId, {
    guildId: input.guildId,
    adventureId: input.adventureId,
    actorId: created.id,
    sessionId: null,
    occurredAt: new Date().toISOString(),
    title: "Entrou na crônica",
    visibility: "player",
    type: "joined",
    initialClasses: [{ className: input.className, levels: initialLevel }],
  });

  return rebuildSnapshot(repos, input.guildId, input.adventureId, created.id);
}
