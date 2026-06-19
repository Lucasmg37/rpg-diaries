import type { Adventure } from "./adventure";
import type { Adventurer } from "./adventurer";
import type { Guild } from "./guild";
import type { LooseEnd } from "./loose-end";
import type { Session, SessionClosing, Tag, TimelineEntry } from "./session";
import type { ParticipantState } from "./session-participant";

/**
 * Tipos "compostos" produzidos pelos use cases de leitura. Eles fazem o join
 * entre Session (participants[].adventurerId, looseEndIds) e as entidades
 * fixas (Adventurer, LooseEnd), e podem omitir campos sensíveis (masterNotes).
 */

/** Aventureiro resolvido + o que muda por sessão (badge/estado/nota contextual). */
export interface ResolvedParticipant {
  adventurer: Adventurer;
  sessionBadge: string;
  sessionState?: ParticipantState;
  sessionNote?: string;
}

/**
 * Sessão com participantes e fios soltos já resolvidos.
 * `masterNotes` é opcional: só presente quando explicitamente solicitado
 * (área logada). Nas páginas públicas ele NUNCA é incluído.
 */
export interface FullSession {
  id: string;
  guildId: string;
  adventureId: string;
  title: string;
  number: number;
  icon: string;
  summary: string;
  timeline: TimelineEntry[];
  tags: Tag[];
  masterNotes?: string;
  participants: ResolvedParticipant[];
  looseEnds: LooseEnd[];
  closing?: SessionClosing;
  createdAt: Date;
  updatedAt: Date;
}

/** Aventura com sessões resolvidas + elenco e fios soltos completos. */
export interface FullAdventure {
  adventure: Adventure;
  sessions: FullSession[];
  adventurers: Adventurer[];
  looseEnds: LooseEnd[];
}

/** Guild completa, com todas as aventuras resolvidas. */
export interface FullGuild {
  guild: Guild;
  adventures: FullAdventure[];
}

export type { Session };
