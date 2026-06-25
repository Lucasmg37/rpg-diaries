import type {
  Adventure,
  CreateAdventureInput,
  UpdateAdventureInput,
} from "../entities/adventure";

export interface AdventureRepository {
  getById(guildId: string, id: string): Promise<Adventure | null>;
  listByGuild(guildId: string): Promise<Adventure[]>;
  create(input: CreateAdventureInput): Promise<Adventure>;
  update(
    guildId: string,
    id: string,
    patch: UpdateAdventureInput,
  ): Promise<Adventure>;
  delete(guildId: string, id: string): Promise<void>;
}
