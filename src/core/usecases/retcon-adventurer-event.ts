import type { CreateAdventurerEventInput } from "@/core/entities/adventurer-event";
import type { Repositories } from "@/core/ports";
import { rebuildSnapshot } from "./append-adventurer-event";

/**
 * Corrige um evento já gravado sem apagar o histórico: grava `correction`
 * marcando `retcons: targetEventId`, e o evento original passa a ter
 * `retconnedBy` apontando para a correção (o reducer ignora eventos
 * retconados). Recomputa o snapshot de quem é dono da correção — e também do
 * dono do evento original, se for outro aventureiro (caso raro, mas possível
 * se a correção mudar de ator).
 */
export async function retconAdventurerEvent(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  targetEventId: string,
  correction: CreateAdventurerEventInput,
) {
  const created = await repos.adventurerEvents.retconEvent(
    guildId,
    adventureId,
    targetEventId,
    correction,
  );

  await rebuildSnapshot(repos, guildId, adventureId, created.actorId);

  return created;
}
