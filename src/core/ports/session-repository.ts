import type {
  CreateSessionInput,
  Session,
  TimelineEntry,
  UpdateSessionInput,
} from "../entities/session";
import type { SessionParticipant } from "../entities/session-participant";

export interface SessionRepository {
  getById(
    guildId: string,
    adventureId: string,
    id: string,
  ): Promise<Session | null>;
  listByAdventure(guildId: string, adventureId: string): Promise<Session[]>;
  create(input: CreateSessionInput): Promise<Session>;
  update(
    guildId: string,
    adventureId: string,
    id: string,
    patch: UpdateSessionInput,
  ): Promise<Session>;
  /**
   * Insere uma entrada nova (ou atualiza, se `entry.id` já existir) na
   * timeline sem exigir o array inteiro. `position` (0-based) controla
   * onde a entrada entra quando é nova; se omitido, vai para o fim.
   */
  upsertTimelineEntry(
    guildId: string,
    adventureId: string,
    id: string,
    entry: TimelineEntry,
    position?: number,
  ): Promise<Session>;
  /** Remove uma entrada da timeline pelo seu id. */
  removeTimelineEntry(
    guildId: string,
    adventureId: string,
    id: string,
    entryId: string,
  ): Promise<Session>;
  /** Reordena as entradas da timeline de acordo com a lista de ids fornecida. */
  reorderTimelineEntries(
    guildId: string,
    adventureId: string,
    id: string,
    entryIds: string[],
  ): Promise<Session>;
  /**
   * Insere um participante novo (ou atualiza, se já existir um com o
   * mesmo `adventurerId`) sem exigir o array `participants` inteiro.
   */
  upsertParticipant(
    guildId: string,
    adventureId: string,
    id: string,
    participant: SessionParticipant,
  ): Promise<Session>;
  /** Remove um participante da sessão pelo `adventurerId`. */
  removeParticipant(
    guildId: string,
    adventureId: string,
    id: string,
    adventurerId: string,
  ): Promise<Session>;
  delete(guildId: string, adventureId: string, id: string): Promise<void>;
}
