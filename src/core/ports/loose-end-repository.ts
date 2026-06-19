import type {
  CreateLooseEndInput,
  LooseEnd,
  UpdateLooseEndInput,
} from "../entities/loose-end";

export interface LooseEndRepository {
  listByAdventure(guildId: string, adventureId: string): Promise<LooseEnd[]>;
  create(input: CreateLooseEndInput): Promise<LooseEnd>;
  update(
    guildId: string,
    adventureId: string,
    id: string,
    patch: UpdateLooseEndInput,
  ): Promise<LooseEnd>;
}
