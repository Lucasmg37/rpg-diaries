import type { Guild } from "../entities/guild";

export interface GuildRepository {
  getById(id: string): Promise<Guild | null>;
}
