import type { Npc } from "../entities/npc";
import type { EventVisibility } from "../entities/adventurer-event";
import type { NpcEvent } from "../entities/npc-event";
import { NotFoundError } from "../errors";
import type { Repositories } from "../ports";

export interface NpcWithTimeline {
  npc: Npc;
  timeline: NpcEvent[];
}

/**
 * NPC + sua timeline de eventos. Sem `visibility`, traz tudo (área logada).
 * Com `visibility: "player"`, filtra os eventos sigilosos do mestre — uso da
 * ficha pública do NPC.
 */
export async function getNpcWithTimeline(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  npcId: string,
  visibility?: EventVisibility,
): Promise<NpcWithTimeline> {
  const npc = await repos.npcs.getById(guildId, adventureId, npcId);
  if (!npc) {
    throw new NotFoundError(`NPC "${npcId}" não encontrado.`);
  }

  const timeline = await repos.npcEvents.listEvents(guildId, adventureId, {
    npcId,
    visibility,
  });

  return { npc, timeline };
}
