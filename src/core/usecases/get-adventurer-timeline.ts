import type { Adventurer } from "../entities/adventurer";
import type { AdventurerEvent, EventVisibility } from "../entities/adventurer-event";
import { NotFoundError } from "../errors";
import type { Repositories } from "../ports";

export interface AdventurerWithTimeline {
  adventurer: Adventurer;
  timeline: AdventurerEvent[];
}

/**
 * Aventureiro + sua timeline de eventos. Sem `visibility`, traz tudo (uso
 * exclusivo da área logada). Com `visibility: "player"`, filtra os eventos
 * sigilosos do mestre — é o que a página pública do aventureiro deve usar.
 */
export async function getAdventurerWithTimeline(
  repos: Repositories,
  guildId: string,
  adventureId: string,
  adventurerId: string,
  visibility?: EventVisibility,
): Promise<AdventurerWithTimeline> {
  const adventurers = await repos.adventurers.listByAdventure(
    guildId,
    adventureId,
  );
  const adventurer = adventurers.find((a) => a.id === adventurerId);
  if (!adventurer) {
    throw new NotFoundError(`Aventureiro "${adventurerId}" não encontrado.`);
  }

  const timeline = await repos.adventurerEvents.listEvents(
    guildId,
    adventureId,
    { adventurerId, visibility },
  );

  return { adventurer, timeline };
}
