import type {
  Adventurer,
  AdventurerRepositoryPatch,
  CreateAdventurerInput,
} from "../entities/adventurer";

export interface AdventurerRepository {
  listByAdventure(guildId: string, adventureId: string): Promise<Adventurer[]>;
  create(input: CreateAdventurerInput): Promise<Adventurer>;
  update(
    guildId: string,
    adventureId: string,
    id: string,
    patch: AdventurerRepositoryPatch,
  ): Promise<Adventurer>;
  delete(guildId: string, adventureId: string, id: string): Promise<void>;
}
