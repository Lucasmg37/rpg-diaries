import type {
  CreateStoryNoteInput,
  CreateStoryPlanInput,
  StoryPlan,
  UpdateStoryPlanInput,
} from "../entities/story-plan";

export interface StoryPlanRepository {
  getById(
    guildId: string,
    adventureId: string,
    id: string,
  ): Promise<StoryPlan | null>;
  listByAdventure(guildId: string, adventureId: string): Promise<StoryPlan[]>;
  create(input: CreateStoryPlanInput): Promise<StoryPlan>;
  update(
    guildId: string,
    adventureId: string,
    id: string,
    patch: UpdateStoryPlanInput,
  ): Promise<StoryPlan>;
  /** Anexa uma nota viva ao roteiro e devolve o roteiro atualizado. */
  addNote(
    guildId: string,
    adventureId: string,
    id: string,
    note: CreateStoryNoteInput,
  ): Promise<StoryPlan>;
  delete(guildId: string, adventureId: string, id: string): Promise<void>;
}
