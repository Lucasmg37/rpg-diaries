import type { CreateNpcInput, Npc } from "../entities/npc";
import { NotFoundError } from "../errors";
import type { Repositories } from "../ports";
import { rebuildNpcSnapshot } from "./append-npc-event";

/**
 * Cria um NPC/Boss na adventure e grava o evento `status_change` (unknown ->
 * alive) que dá origem ao snapshot — todo NPC tem snapshot desde a criação,
 * espelhando o evento `joined` de createAdventurer.
 */
export async function createNpc(
  repos: Repositories,
  input: CreateNpcInput,
): Promise<Npc> {
  const adventure = await repos.adventures.getById(
    input.guildId,
    input.adventureId,
  );
  if (!adventure) {
    throw new NotFoundError(`Adventure "${input.adventureId}" não encontrada.`);
  }

  const created = await repos.npcs.create(input);

  await repos.npcEvents.appendEvent(input.guildId, input.adventureId, {
    guildId: input.guildId,
    adventureId: input.adventureId,
    npcId: created.id,
    sessionId: null,
    occurredAt: new Date().toISOString(),
    title: "Registrado na crônica",
    visibility: "master",
    type: "status_change",
    from: "unknown",
    to: "alive",
  });

  return rebuildNpcSnapshot(repos, input.guildId, input.adventureId, created.id);
}
