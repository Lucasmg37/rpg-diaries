/**
 * Evento imutável da linha do tempo de um (ou mais) aventureiro(s).
 * Fonte da verdade da história; AdventurerSnapshot é só a projeção/cache
 * (ver core/usecases/project-snapshot.ts).
 *
 * Evento cross-character (ex.: um soco) existe UMA vez, com actorId + targetIds.
 * `participantIds` é o índice de leitura denormalizado (= único([actorId, ...targetIds])).
 */

export type EventVisibility = "player" | "master";

export interface AdventurerEventBase {
  id: string;
  guildId: string;
  adventureId: string;
  arcId?: string;
  /** null = backstory ou entre-sessões. */
  sessionId?: string | null;

  actorId: string;
  targetIds?: string[];
  participantIds: string[];

  /** Timestamp real — ordenação canônica + auditoria. */
  occurredAt: string;
  /** Data narrativa do mundo (opcional). */
  inWorldDate?: string;
  /** Desempate entre eventos do mesmo instante/sessão. */
  sequence?: number;

  title: string;
  body?: string;
  icon?: string;
  visibility: EventVisibility;
  relatedLooseEndIds?: string[];

  /** Id do evento que ESTE corrige. */
  retcons?: string;
  /** Id do evento que corrige este (se presente, ignorar na projeção). */
  retconnedBy?: string;

  createdAt: string;
}

export interface ClassLevel {
  className: string;
  levels: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  icon?: string;
  rarity?: string;
  note?: string;
  /** Quantidade na pilha (ex.: 3 Poções de Ácido). Ausente/1 = item único. */
  quantity?: number;
}

export type AdventurerStatus = "active" | "dead" | "missing" | "retired";
export type AdventurerState = "normal" | "suspicious" | "fallen" | "new";

export interface JoinedEvent extends AdventurerEventBase {
  type: "joined";
  initialClasses: ClassLevel[];
}

export interface LevelUpEvent extends AdventurerEventBase {
  type: "level_up";
  className: string;
  fromLevel: number;
  toLevel: number;
}

export interface StatusChangeEvent extends AdventurerEventBase {
  type: "status_change";
  from: AdventurerStatus;
  to: AdventurerStatus;
}

export interface StateFlagEvent extends AdventurerEventBase {
  type: "state_flag";
  to: AdventurerState;
}

export interface ItemGainedEvent extends AdventurerEventBase {
  type: "item_gained";
  item: InventoryItem;
}

export interface ItemLostEvent extends AdventurerEventBase {
  type: "item_lost";
  itemId: string;
  reason?: string;
}

export interface RelationshipEvent extends AdventurerEventBase {
  type: "relationship";
  nature: "alliance" | "conflict" | "bond" | "betrayal";
}

export interface InjuryEvent extends AdventurerEventBase {
  type: "injury";
  severity?: "minor" | "grave" | "critical";
}

export interface DeathEvent extends AdventurerEventBase {
  type: "death";
  cause?: string;
}

export interface RevivalEvent extends AdventurerEventBase {
  type: "revival";
  method?: string;
}

export interface TitleBadgeEvent extends AdventurerEventBase {
  type: "title_badge";
  title: string;
  granted: boolean;
}

export interface SheetRevisionEvent extends AdventurerEventBase {
  type: "sheet_revision";
  sheetUrl: string;
  note?: string;
}

export interface StoryBeatEvent extends AdventurerEventBase {
  type: "story_beat";
}

export type AdventurerEvent =
  | JoinedEvent
  | LevelUpEvent
  | StatusChangeEvent
  | StateFlagEvent
  | ItemGainedEvent
  | ItemLostEvent
  | RelationshipEvent
  | InjuryEvent
  | DeathEvent
  | RevivalEvent
  | TitleBadgeEvent
  | SheetRevisionEvent
  | StoryBeatEvent;

/** Omit que distribui sobre union types (Omit normal colapsa para os campos comuns). */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, Extract<keyof T, K>>
  : never;

/** Input de criação: id, participantIds e createdAt são derivados/gerados pelo repositório. */
export type CreateAdventurerEventInput = DistributiveOmit<
  AdventurerEvent,
  "id" | "participantIds" | "createdAt"
>;

export interface AdventurerSnapshot {
  classes: ClassLevel[];
  totalLevel: number;
  status: AdventurerStatus;
  state: AdventurerState;
  sheetUrl?: string;
  inventory: InventoryItem[];
  titles: string[];
  lastSeenSessionId?: string;
  lastEventAt?: string;
  eventCount: number;
}
