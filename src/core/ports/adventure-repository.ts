import type { Adventure } from "../entities/adventure";

export interface AdventureRepository {
  getById(guildId: string, id: string): Promise<Adventure | null>;
  listByGuild(guildId: string): Promise<Adventure[]>;
}
