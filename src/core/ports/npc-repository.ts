import type {
  CreateNpcInput,
  Npc,
  NpcRepositoryPatch,
} from "../entities/npc";

export interface NpcRepository {
  listByAdventure(guildId: string, adventureId: string): Promise<Npc[]>;
  getById(guildId: string, adventureId: string, id: string): Promise<Npc | null>;
  create(input: CreateNpcInput): Promise<Npc>;
  update(
    guildId: string,
    adventureId: string,
    id: string,
    patch: NpcRepositoryPatch,
  ): Promise<Npc>;
  delete(guildId: string, adventureId: string, id: string): Promise<void>;
}
