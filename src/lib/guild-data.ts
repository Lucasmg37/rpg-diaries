import { cache } from "react";

import { getMasterGuildId } from "@/adapters/config/master-config";
import { getRepositories } from "@/adapters/config/repository-factory";
import type { FullGuild } from "@/core/entities/views";
import { getFullGuild } from "@/core/usecases/get-full-guild";

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
