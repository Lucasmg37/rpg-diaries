import type { EventVisibility, InventoryItem } from "./adventurer-event";

/**
 * Evento imutável da timeline de um NPC/Boss. Mesmo desenho do AdventurerEvent
 * (ver adventurer-event.ts): fonte da verdade, NpcSnapshot é só a projeção.
 */

export interface NpcEventBase {
  id: string;
  guildId: string;
  adventureId: string;
  arcId?: string;
  /** null = histórico/preparação, antes de qualquer sessão. */
  sessionId?: string | null;

  npcId: string;
  /** Outros NPCs ou aventureiros envolvidos (combate, diálogo, aliança). */
  participantIds?: string[];

  occurredAt: string;
  sequence?: number;

  title: string;
  body?: string;
  visibility: EventVisibility;

  /** Id do evento que ESTE corrige. */
  retcons?: string;
  /** Id do evento que corrige este (se presente, ignorar na projeção). */
  retconnedBy?: string;

  createdAt: string;
}

export type NpcStatus = "alive" | "dead" | "revived" | "missing" | "unknown";

export interface StatusChangeNpcEvent extends NpcEventBase {
  type: "status_change";
  from: NpcStatus;
  to: NpcStatus;
  cause?: string;
}

/** Marca que o NPC apareceu numa sessão e quais aventureiros o viram. */
export interface AppearanceEvent extends NpcEventBase {
  type: "appearance";
  sessionId: string;
  seenByAdventurerIds: string[];
}

export interface ItemGainedNpcEvent extends NpcEventBase {
  type: "item_gained";
  item: InventoryItem;
}

export interface ItemLostNpcEvent extends NpcEventBase {
  type: "item_lost";
  itemId: string;
  reason?: string;
}

export interface RelationshipNpcEvent extends NpcEventBase {
  type: "relationship";
  nature: "alliance" | "conflict" | "bond" | "betrayal";
}

export interface NoteNpcEvent extends NpcEventBase {
  type: "note";
}

export type NpcEvent =
  | StatusChangeNpcEvent
  | AppearanceEvent
  | ItemGainedNpcEvent
  | ItemLostNpcEvent
  | RelationshipNpcEvent
  | NoteNpcEvent;

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, Extract<keyof T, K>>
  : never;

/** Input de criação: id e createdAt são derivados/gerados pelo repositório. */
export type CreateNpcEventInput = DistributiveOmit<
  NpcEvent,
  "id" | "createdAt"
>;

export interface NpcSnapshot {
  status: NpcStatus;
  inventory: InventoryItem[];
  /** União de adventurerIds que já viram este NPC em qualquer appearance. */
  seenByAdventurerIds: string[];
  appearedInSessionIds: string[];
  lastEventAt?: string;
  eventCount: number;
}
