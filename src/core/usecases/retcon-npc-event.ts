import type { CreateNpcEventInput } from "@/core/entities/npc-event";
import type { Repositories } from "@/core/ports";
import { rebuildNpcSnapshot } from "./append-npc-event";

/**
 * Corrige um evento já gravado sem apagar o histórico — espelha
 * retcon-adventurer-event.ts.
 */
export async function retconNpcEvent(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  targetEventId: string,
  correction: CreateNpcEventInput,
) {
  const created = await repos.npcEvents.retconEvent(
    guildId,
    adventureId,
    targetEventId,
    correction,
  );

  await rebuildNpcSnapshot(repos, guildId, adventureId, created.npcId);

  return created;
}
