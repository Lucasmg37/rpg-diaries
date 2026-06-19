import type {
  CreateSessionInput,
  Session,
  UpdateSessionInput,
} from "../entities/session";

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
  delete(guildId: string, adventureId: string, id: string): Promise<void>;
}
