import { cache } from "react";

import { getMasterGuildId } from "@/adapters/config/master-config";
import { getRepositories } from "@/adapters/config/repository-factory";
import type { FullGuild } from "@/core/entities/views";
import { getAdventureNpcRoster } from "@/core/usecases/get-adventure-npc-roster";
import { getAdventurerWithTimeline } from "@/core/usecases/get-adventurer-timeline";
import { getFullGuild } from "@/core/usecases/get-full-guild";
import { getNpcWithTimeline } from "@/core/usecases/get-npc-timeline";
import { npcHasAppeared } from "@/lib/npc-view";

/**
 * Carrega a guild do master, totalmente resolvida, SEM masterNotes (payload
 * público). `cache()` deduplica a chamada dentro de um mesmo passo de render
 * (ex.: generateStaticParams + o componente da página).
 */
export const getPublicMasterGuild = cache(async (): Promise<FullGuild> => {
  const repos = getRepositories();
  const guildId = getMasterGuildId();
  const guild = await getFullGuild(repos, guildId);
  if (!guild) {
    throw new Error(
      `Guild do master "${guildId}" não encontrada. Rode o seed ou configure MASTER_GUILD_ID.`,
    );
  }
  return guild;
});

/**
 * Aventureiro + timeline pública (só eventos `visibility: "player"`) — usado
 * pela página pública do aventureiro. Eventos sigilosos do mestre nunca
 * chegam aqui.
 */
export const getPublicAdventurerTimeline = cache(
  async (adventureId: string, adventurerId: string) => {
    const repos = getRepositories();
    const guildId = getMasterGuildId();
    return getAdventurerWithTimeline(
      repos,
      guildId,
      adventureId,
      adventurerId,
      "player",
    );
  },
);

/**
 * NPCs/Bosses de uma aventura já apresentados em ao menos uma sessão — só
 * estes ganham página pública (quem nunca apareceu é só preparo do mestre).
 */
export const getPublicNpcRoster = cache(async (adventureId: string) => {
  const repos = getRepositories();
  const guildId = getMasterGuildId();
  const npcs = await getAdventureNpcRoster(repos, guildId, adventureId);
  return npcs.filter(npcHasAppeared);
});

/**
 * NPC + timeline pública (só eventos `visibility: "player"`) — usado pela
 * página pública do NPC. masterNotes e eventos sigilosos nunca chegam aqui.
 */
export const getPublicNpcTimeline = cache(
  async (adventureId: string, npcId: string) => {
    const repos = getRepositories();
    const guildId = getMasterGuildId();
    const { npc, timeline } = await getNpcWithTimeline(
      repos,
      guildId,
      adventureId,
      npcId,
      "player",
    );
    const { masterNotes: _omit, ...publicNpc } = npc;
    return { npc: publicNpc, timeline };
  },
);
