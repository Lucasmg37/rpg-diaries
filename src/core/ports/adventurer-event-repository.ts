import type {
  AdventurerEvent,
  CreateAdventurerEventInput,
  EventVisibility,
} from "@/core/entities/adventurer-event";

export interface EventQuery {
  /** Filtra por participantIds (dono OU alvo). */
  adventurerId?: string;
  arcId?: string;
  sessionId?: string;
  types?: AdventurerEvent["type"][];
  visibility?: EventVisibility;
  since?: string;
  until?: string;
}

export interface AdventurerEventRepository {
  /** Append-only — eventos nunca são atualizados nem removidos. */
  appendEvent(
    guildId: string,
    adventureId: string,
    input: CreateAdventurerEventInput,
  ): Promise<AdventurerEvent>;

  listEvents(
    guildId: string,
    adventureId: string,
    query?: EventQuery,
  ): Promise<AdventurerEvent[]>;

  /** Grava `correction` e marca `targetEventId.retconnedBy` com o id da correção. */
  retconEvent(
    guildId: string,
    adventureId: string,
    targetEventId: string,
    correction: CreateAdventurerEventInput,
  ): Promise<AdventurerEvent>;
}
