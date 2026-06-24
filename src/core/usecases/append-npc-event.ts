import type { CreateNpcEventInput } from "@/core/entities/npc-event";
import type { Repositories } from "@/core/ports";
import { projectNpcSnapshot } from "./project-npc-snapshot";

/** Grava um evento na timeline do NPC e recomputa seu snapshot. */
export async function appendNpcEvent(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  input: CreateNpcEventInput,
) {
  const event = await repos.npcEvents.appendEvent(guildId, adventureId, input);

  await rebuildNpcSnapshot(repos, guildId, adventureId, event.npcId);

  return event;
}

/** Reprojeta o snapshot de um NPC a partir do log de eventos dele. */
export async function rebuildNpcSnapshot(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  npcId: string,
) {
  const events = await repos.npcEvents.listEvents(guildId, adventureId, {
    npcId,
  });
  const snapshot = projectNpcSnapshot(events);

  return repos.npcs.update(guildId, adventureId, npcId, { snapshot });
}
