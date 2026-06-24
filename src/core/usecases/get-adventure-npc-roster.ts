import type { Npc, NpcKind } from "../entities/npc";
import type { NpcStatus } from "../entities/npc-event";
import type { Repositories } from "../ports";

export interface NpcRosterFilter {
  kind?: NpcKind;
  status?: NpcStatus;
  /** Se informado, restringe ao que esse aventureiro já viu (uso público). */
  seenByAdventurerId?: string;
}

/** Lista completa de NPCs/Bosses da aventura, com filtros opcionais. */
export async function getAdventureNpcRoster(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  filter: NpcRosterFilter = {},
): Promise<Npc[]> {
  let npcs = await repos.npcs.listByAdventure(guildId, adventureId);

  if (filter.kind) {
    npcs = npcs.filter((n) => n.kind === filter.kind);
  }
  if (filter.status) {
    npcs = npcs.filter((n) => n.snapshot?.status === filter.status);
  }
  if (filter.seenByAdventurerId) {
    npcs = npcs.filter((n) =>
      n.snapshot?.seenByAdventurerIds.includes(filter.seenByAdventurerId!),
    );
  }

  return npcs;
}
