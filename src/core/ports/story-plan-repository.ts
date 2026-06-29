import type {
  CreateStoryNoteInput,
  CreateStoryPlanInput,
  Scene,
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
  /**
   * Insere uma cena nova (ou atualiza, se `scene.id` já existir) sem exigir
   * o array `scenes` inteiro. `position` (índice 0-based) controla onde a
   * cena entra quando é nova; se omitido, vai para o fim. Ao atualizar uma
   * cena existente, `position` também pode ser usado para reposicioná-la.
   */
  upsertScene(
    guildId: string,
    adventureId: string,
    id: string,
    scene: Scene,
    position?: number,
  ): Promise<StoryPlan>;
  /** Remove uma cena do roteiro pelo seu id. */
  removeScene(
    guildId: string,
    adventureId: string,
    id: string,
    sceneId: string,
  ): Promise<StoryPlan>;
  /** Reordena as cenas existentes de acordo com a lista de ids fornecida. */
  reorderScenes(
    guildId: string,
    adventureId: string,
    id: string,
    sceneIds: string[],
  ): Promise<StoryPlan>;
  delete(guildId: string, adventureId: string, id: string): Promise<void>;
}
