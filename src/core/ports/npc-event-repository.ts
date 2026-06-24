import type {
  CreateNpcEventInput,
  NpcEvent,
} from "@/core/entities/npc-event";
import type { EventVisibility } from "@/core/entities/adventurer-event";

export interface NpcEventQuery {
  npcId?: string;
  sessionId?: string;
  arcId?: string;
  types?: NpcEvent["type"][];
  visibility?: EventVisibility;
  since?: string;
  until?: string;
}

export interface NpcEventRepository {
  /** Append-only — eventos nunca são atualizados nem removidos. */
  appendEvent(
    guildId: string,
    adventureId: string,
    input: CreateNpcEventInput,
  ): Promise<NpcEvent>;

  listEvents(
    guildId: string,
    adventureId: string,
    query?: NpcEventQuery,
  ): Promise<NpcEvent[]>;

  /** Grava `correction` e marca `targetEventId.retconnedBy` com o id da correção. */
  retconEvent(
    guildId: string,
    adventureId: string,
    targetEventId: string,
    correction: CreateNpcEventInput,
  ): Promise<NpcEvent>;
}
