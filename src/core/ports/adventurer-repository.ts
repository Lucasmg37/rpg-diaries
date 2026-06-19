import type {
  Adventurer,
  CreateAdventurerInput,
  UpdateAdventurerInput,
} from "../entities/adventurer";

export interface AdventurerRepository {
  listByAdventure(guildId: string, adventureId: string): Promise<Adventurer[]>;
  create(input: CreateAdventurerInput): Promise<Adventurer>;
  update(
    guildId: string,
    adventureId: string,
    id: string,
    patch: UpdateAdventurerInput,
  ): Promise<Adventurer>;
}
