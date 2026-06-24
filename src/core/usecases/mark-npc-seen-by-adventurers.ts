import type { Repositories } from "../ports";
import { appendNpcEvent } from "./append-npc-event";

/**
 * Marca que um NPC apareceu numa sessão e foi visto pelos aventureiros
 * informados — grava um `AppearanceEvent` e recomputa o snapshot, atualizando
 * `seenByAdventurerIds`/`appearedInSessionIds`. É o atalho usado quando o
 * mestre associa um NPC a uma sessão (Session.npcIds) ou a uma cena de
 * roteiro (StoryPlan.scenes[].npcIds).
 */
export async function markNpcSeenByAdventurers(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  npcId: string,
  sessionId: string,
  seenByAdventurerIds: string[],
) {
  return appendNpcEvent(repos, guildId, adventureId, {
    guildId,
    adventureId,
    npcId,
    sessionId,
    occurredAt: new Date().toISOString(),
    title: "Apareceu na sessão",
    visibility: "player",
    type: "appearance",
    seenByAdventurerIds,
  });
}
