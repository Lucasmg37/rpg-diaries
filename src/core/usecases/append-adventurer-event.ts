import type { CreateAdventurerEventInput } from "@/core/entities/adventurer-event";
import type { Repositories } from "@/core/ports";
import { projectSnapshot } from "./project-snapshot";

/**
 * Grava um evento na timeline e recomputa o snapshot de cada aventureiro que é
 * DONO (actorId) do evento. Quem só participa como target (ex.: alvo de um
 * `relationship`) tem o evento na timeline, mas não tem o snapshot recomputado
 * por causa dele — ver nota no reducer (project-snapshot.ts).
 */
export async function appendAdventurerEvent(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  input: CreateAdventurerEventInput,
) {
  const event = await repos.adventurerEvents.appendEvent(
    guildId,
    adventureId,
    input,
  );

  await rebuildSnapshot(repos, guildId, adventureId, event.actorId);

  return event;
}

/** Reprojeta o snapshot de um aventureiro a partir do log de eventos onde ele é dono. */
export async function rebuildSnapshot(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  adventurerId: string,
) {
  const events = await repos.adventurerEvents.listEvents(guildId, adventureId, {
    adventurerId,
  });
  const owned = events.filter((e) => e.actorId === adventurerId);
  const snapshot = projectSnapshot(owned);

  return repos.adventurers.update(guildId, adventureId, adventurerId, {
    snapshot,
  });
}
