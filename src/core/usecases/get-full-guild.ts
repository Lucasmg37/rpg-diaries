import type { FullGuild } from "../entities/views";
import type { Repositories } from "../ports";
import { buildFullAdventure } from "./get-full-adventure";
import type { GetFullSessionOptions } from "./get-full-session";

/**
 * Resolve a Guild completa: a guild + todas as suas aventuras (ordenadas por
 * `order`) já resolvidas. Tudo top-down a partir do id da guild — sem consultas
 * de collection group. Base para a home e para o dashboard do admin.
 */
export async function getFullGuild(
  repos: Repositories,
  guildId: string,
  options: GetFullSessionOptions = {},
): Promise<FullGuild | null> {
  const guild = await repos.guilds.getById(guildId);
  if (!guild) return null;

  const adventures = await repos.adventures.listByGuild(guildId);

  const fullAdventures = await Promise.all(
    adventures.map((adventure) =>
      buildFullAdventure(repos, adventure, options),
    ),
  );

  fullAdventures.sort((a, b) => a.adventure.order - b.adventure.order);

  return { guild, adventures: fullAdventures };
}
