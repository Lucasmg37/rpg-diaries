import { randomUUID } from "node:crypto";

import { NotFoundError } from "@/core/errors";
import type {
  Adventure,
  CreateAdventureInput,
  UpdateAdventureInput,
} from "@/core/entities/adventure";
import type {
  Adventurer,
  AdventurerRepositoryPatch,
  CreateAdventurerInput,
} from "@/core/entities/adventurer";
import type {
  AdventurerEvent,
  CreateAdventurerEventInput,
} from "@/core/entities/adventurer-event";
import type { Guild } from "@/core/entities/guild";
import type {
  CreateLooseEndInput,
  LooseEnd,
  UpdateLooseEndInput,
} from "@/core/entities/loose-end";
import type { CreateNpcEventInput, NpcEvent } from "@/core/entities/npc-event";
import type { CreateNpcInput, Npc, NpcRepositoryPatch } from "@/core/entities/npc";
import type {
  CreateSessionInput,
  Session,
  UpdateSessionInput,
} from "@/core/entities/session";
import type {
  CreateStoryNoteInput,
  CreateStoryPlanInput,
  StoryNote,
  StoryPlan,
  UpdateStoryPlanInput,
} from "@/core/entities/story-plan";
import type {
  AdventureRepository,
  AdventurerEventRepository,
  AdventurerRepository,
  EventQuery,
  GuildRepository,
  LooseEndRepository,
  NpcEventQuery,
  NpcEventRepository,
  NpcRepository,
  Repositories,
  SessionRepository,
  StoryPlanRepository,
} from "@/core/ports";

/**
 * Armazenamento em memória compartilhado por todos os repositórios in-memory.
 * Usado na Fase 1 (testar use cases sem Firestore) e como fallback de
 * desenvolvimento quando as credenciais do Firebase não estão configuradas.
 */
export interface InMemoryStore {
  guilds: Map<string, Guild>;
  adventures: Map<string, Adventure>;
  sessions: Map<string, Session>;
  adventurers: Map<string, Adventurer>;
  adventurerEvents: Map<string, AdventurerEvent>;
  looseEnds: Map<string, LooseEnd>;
  storyPlans: Map<string, StoryPlan>;
  npcs: Map<string, Npc>;
  npcEvents: Map<string, NpcEvent>;
}

export function createEmptyStore(): InMemoryStore {
  return {
    guilds: new Map(),
    adventures: new Map(),
    sessions: new Map(),
    adventurers: new Map(),
    adventurerEvents: new Map(),
    looseEnds: new Map(),
    storyPlans: new Map(),
    npcs: new Map(),
    npcEvents: new Map(),
  };
}

class InMemoryGuildRepository implements GuildRepository {
  constructor(private readonly store: InMemoryStore) {}

  async getById(id: string): Promise<Guild | null> {
    return this.store.guilds.get(id) ?? null;
  }
}

class InMemoryAdventureRepository implements AdventureRepository {
  constructor(private readonly store: InMemoryStore) {}

  async getById(_guildId: string, id: string): Promise<Adventure | null> {
    return this.store.adventures.get(id) ?? null;
  }

  async listByGuild(guildId: string): Promise<Adventure[]> {
    return [...this.store.adventures.values()]
      .filter((a) => a.guildId === guildId)
      .sort((a, b) => a.order - b.order);
  }

  async create(input: CreateAdventureInput): Promise<Adventure> {
    const adventure: Adventure = { ...input, id: randomUUID(), createdAt: new Date() };
    this.store.adventures.set(adventure.id, adventure);
    return adventure;
  }

  async update(
    guildId: string,
    id: string,
    patch: UpdateAdventureInput,
  ): Promise<Adventure> {
    const existing = this.store.adventures.get(id);
    if (!existing) throw new NotFoundError(`Aventura "${id}" não encontrada.`);
    const updated: Adventure = { ...existing, ...patch };
    this.store.adventures.set(id, updated);
    return updated;
  }

  async delete(_guildId: string, id: string): Promise<void> {
    if (!this.store.adventures.delete(id)) {
      throw new NotFoundError(`Aventura "${id}" não encontrada.`);
    }
  }
}

class InMemorySessionRepository implements SessionRepository {
  constructor(private readonly store: InMemoryStore) {}

  async getById(
    _guildId: string,
    _adventureId: string,
    id: string,
  ): Promise<Session | null> {
    return this.store.sessions.get(id) ?? null;
  }

  async listByAdventure(
    _guildId: string,
    adventureId: string,
  ): Promise<Session[]> {
    return [...this.store.sessions.values()]
      .filter((s) => s.adventureId === adventureId)
      .sort((a, b) => a.number - b.number);
  }

  async create(input: CreateSessionInput): Promise<Session> {
    const now = new Date();
    const session: Session = {
      ...input,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    this.store.sessions.set(session.id, session);
    return session;
  }

  async update(
    _guildId: string,
    _adventureId: string,
    id: string,
    patch: UpdateSessionInput,
  ): Promise<Session> {
    const existing = this.store.sessions.get(id);
    if (!existing) throw new NotFoundError(`Sessão "${id}" não encontrada.`);
    const updated: Session = { ...existing, ...patch, updatedAt: new Date() };
    this.store.sessions.set(id, updated);
    return updated;
  }

  async delete(
    _guildId: string,
    _adventureId: string,
    id: string,
  ): Promise<void> {
    if (!this.store.sessions.delete(id)) {
      throw new NotFoundError(`Sessão "${id}" não encontrada.`);
    }
  }
}

class InMemoryAdventurerRepository implements AdventurerRepository {
  constructor(private readonly store: InMemoryStore) {}

  async listByAdventure(
    _guildId: string,
    adventureId: string,
  ): Promise<Adventurer[]> {
    return [...this.store.adventurers.values()]
      .filter((a) => a.adventureId === adventureId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async create(input: CreateAdventurerInput): Promise<Adventurer> {
    const adventurer: Adventurer = { ...input, id: randomUUID() };
    this.store.adventurers.set(adventurer.id, adventurer);
    return adventurer;
  }

  async update(
    _guildId: string,
    _adventureId: string,
    id: string,
    patch: AdventurerRepositoryPatch,
  ): Promise<Adventurer> {
    const existing = this.store.adventurers.get(id);
    if (!existing) throw new NotFoundError(`Aventureiro "${id}" não encontrado.`);
    const updated: Adventurer = { ...existing, ...patch };
    this.store.adventurers.set(id, updated);
    return updated;
  }

  async delete(
    _guildId: string,
    _adventureId: string,
    id: string,
  ): Promise<void> {
    if (!this.store.adventurers.delete(id)) {
      throw new NotFoundError(`Aventureiro "${id}" não encontrado.`);
    }
  }
}

function uniqueParticipants(actorId: string, targetIds?: string[]): string[] {
  return Array.from(new Set([actorId, ...(targetIds ?? [])]));
}

class InMemoryAdventurerEventRepository implements AdventurerEventRepository {
  constructor(private readonly store: InMemoryStore) {}

  async appendEvent(
    _guildId: string,
    adventureId: string,
    input: CreateAdventurerEventInput,
  ): Promise<AdventurerEvent> {
    const event = {
      ...input,
      adventureId,
      id: randomUUID(),
      participantIds: uniqueParticipants(input.actorId, input.targetIds),
      createdAt: new Date().toISOString(),
    } as AdventurerEvent;
    this.store.adventurerEvents.set(event.id, event);
    return event;
  }

  async listEvents(
    _guildId: string,
    adventureId: string,
    query: EventQuery = {},
  ): Promise<AdventurerEvent[]> {
    let events = [...this.store.adventurerEvents.values()].filter(
      (e) => e.adventureId === adventureId,
    );

    if (query.adventurerId) {
      events = events.filter((e) =>
        e.participantIds.includes(query.adventurerId!),
      );
    }
    if (query.sessionId) {
      events = events.filter((e) => e.sessionId === query.sessionId);
    }
    if (query.arcId) {
      events = events.filter((e) => e.arcId === query.arcId);
    }
    if (query.visibility) {
      events = events.filter((e) => e.visibility === query.visibility);
    }
    if (query.types?.length) {
      events = events.filter((e) => query.types!.includes(e.type));
    }
    if (query.since) {
      events = events.filter((e) => e.occurredAt >= query.since!);
    }
    if (query.until) {
      events = events.filter((e) => e.occurredAt <= query.until!);
    }

    return events.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  }

  async retconEvent(
    guildId: string,
    adventureId: string,
    targetEventId: string,
    correction: CreateAdventurerEventInput,
  ): Promise<AdventurerEvent> {
    const target = this.store.adventurerEvents.get(targetEventId);
    if (!target) {
      throw new NotFoundError(`Evento "${targetEventId}" não encontrado.`);
    }

    const correctionEvent = await this.appendEvent(guildId, adventureId, {
      ...correction,
      retcons: targetEventId,
    });

    this.store.adventurerEvents.set(targetEventId, {
      ...target,
      retconnedBy: correctionEvent.id,
    });

    return correctionEvent;
  }
}

class InMemoryLooseEndRepository implements LooseEndRepository {
  constructor(private readonly store: InMemoryStore) {}

  async listByAdventure(
    _guildId: string,
    adventureId: string,
  ): Promise<LooseEnd[]> {
    return [...this.store.looseEnds.values()].filter(
      (l) => l.adventureId === adventureId,
    );
  }

  async create(input: CreateLooseEndInput): Promise<LooseEnd> {
    const looseEnd: LooseEnd = { ...input, id: randomUUID() };
    this.store.looseEnds.set(looseEnd.id, looseEnd);
    return looseEnd;
  }

  async update(
    _guildId: string,
    _adventureId: string,
    id: string,
    patch: UpdateLooseEndInput,
  ): Promise<LooseEnd> {
    const existing = this.store.looseEnds.get(id);
    if (!existing) throw new NotFoundError(`Fio solto "${id}" não encontrado.`);
    const updated: LooseEnd = { ...existing, ...patch };
    this.store.looseEnds.set(id, updated);
    return updated;
  }

  async delete(
    _guildId: string,
    _adventureId: string,
    id: string,
  ): Promise<void> {
    if (!this.store.looseEnds.delete(id)) {
      throw new NotFoundError(`Fio solto "${id}" não encontrado.`);
    }
  }
}

class InMemoryStoryPlanRepository implements StoryPlanRepository {
  constructor(private readonly store: InMemoryStore) {}

  async getById(
    _guildId: string,
    _adventureId: string,
    id: string,
  ): Promise<StoryPlan | null> {
    return this.store.storyPlans.get(id) ?? null;
  }

  async listByAdventure(
    _guildId: string,
    adventureId: string,
  ): Promise<StoryPlan[]> {
    return [...this.store.storyPlans.values()]
      .filter((p) => p.adventureId === adventureId)
      .sort((a, b) => a.order - b.order);
  }

  async create(input: CreateStoryPlanInput): Promise<StoryPlan> {
    const now = new Date();
    const plan: StoryPlan = {
      ...input,
      id: randomUUID(),
      liveNotes: [],
      createdAt: now,
      updatedAt: now,
    };
    this.store.storyPlans.set(plan.id, plan);
    return plan;
  }

  async update(
    _guildId: string,
    _adventureId: string,
    id: string,
    patch: UpdateStoryPlanInput,
  ): Promise<StoryPlan> {
    const existing = this.store.storyPlans.get(id);
    if (!existing) throw new NotFoundError(`Roteiro "${id}" não encontrado.`);
    const updated: StoryPlan = { ...existing, ...patch, updatedAt: new Date() };
    this.store.storyPlans.set(id, updated);
    return updated;
  }

  async addNote(
    _guildId: string,
    _adventureId: string,
    id: string,
    note: CreateStoryNoteInput,
  ): Promise<StoryPlan> {
    const existing = this.store.storyPlans.get(id);
    if (!existing) throw new NotFoundError(`Roteiro "${id}" não encontrado.`);
    const created: StoryNote = {
      id: randomUUID(),
      body: note.body,
      sceneId: note.sceneId,
      createdAt: new Date(),
    };
    const updated: StoryPlan = {
      ...existing,
      liveNotes: [...existing.liveNotes, created],
      updatedAt: new Date(),
    };
    this.store.storyPlans.set(id, updated);
    return updated;
  }

  async delete(
    _guildId: string,
    _adventureId: string,
    id: string,
  ): Promise<void> {
    if (!this.store.storyPlans.delete(id)) {
      throw new NotFoundError(`Roteiro "${id}" não encontrado.`);
    }
  }
}

class InMemoryNpcRepository implements NpcRepository {
  constructor(private readonly store: InMemoryStore) {}

  async listByAdventure(_guildId: string, adventureId: string): Promise<Npc[]> {
    return [...this.store.npcs.values()]
      .filter((n) => n.adventureId === adventureId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getById(
    _guildId: string,
    _adventureId: string,
    id: string,
  ): Promise<Npc | null> {
    return this.store.npcs.get(id) ?? null;
  }

  async create(input: CreateNpcInput): Promise<Npc> {
    const npc: Npc = { ...input, id: randomUUID() };
    this.store.npcs.set(npc.id, npc);
    return npc;
  }

  async update(
    _guildId: string,
    _adventureId: string,
    id: string,
    patch: NpcRepositoryPatch,
  ): Promise<Npc> {
    const existing = this.store.npcs.get(id);
    if (!existing) throw new NotFoundError(`NPC "${id}" não encontrado.`);
    const updated: Npc = { ...existing, ...patch };
    this.store.npcs.set(id, updated);
    return updated;
  }

  async delete(_guildId: string, _adventureId: string, id: string): Promise<void> {
    if (!this.store.npcs.delete(id)) {
      throw new NotFoundError(`NPC "${id}" não encontrado.`);
    }
  }
}

class InMemoryNpcEventRepository implements NpcEventRepository {
  constructor(private readonly store: InMemoryStore) {}

  async appendEvent(
    _guildId: string,
    adventureId: string,
    input: CreateNpcEventInput,
  ): Promise<NpcEvent> {
    const event = {
      ...input,
      adventureId,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    } as NpcEvent;
    this.store.npcEvents.set(event.id, event);
    return event;
  }

  async listEvents(
    _guildId: string,
    adventureId: string,
    query: NpcEventQuery = {},
  ): Promise<NpcEvent[]> {
    let events = [...this.store.npcEvents.values()].filter(
      (e) => e.adventureId === adventureId,
    );

    if (query.npcId) {
      events = events.filter((e) => e.npcId === query.npcId);
    }
    if (query.sessionId) {
      events = events.filter((e) => e.sessionId === query.sessionId);
    }
    if (query.arcId) {
      events = events.filter((e) => e.arcId === query.arcId);
    }
    if (query.visibility) {
      events = events.filter((e) => e.visibility === query.visibility);
    }
    if (query.types?.length) {
      events = events.filter((e) => query.types!.includes(e.type));
    }
    if (query.since) {
      events = events.filter((e) => e.occurredAt >= query.since!);
    }
    if (query.until) {
      events = events.filter((e) => e.occurredAt <= query.until!);
    }

    return events.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  }

  async retconEvent(
    guildId: string,
    adventureId: string,
    targetEventId: string,
    correction: CreateNpcEventInput,
  ): Promise<NpcEvent> {
    const target = this.store.npcEvents.get(targetEventId);
    if (!target) {
      throw new NotFoundError(`Evento "${targetEventId}" não encontrado.`);
    }

    const correctionEvent = await this.appendEvent(guildId, adventureId, {
      ...correction,
      retcons: targetEventId,
    });

    this.store.npcEvents.set(targetEventId, {
      ...target,
      retconnedBy: correctionEvent.id,
    });

    return correctionEvent;
  }
}

/**
 * Monta o conjunto de Repositories sobre um InMemoryStore. Se nenhum store for
 * passado, cria um vazio.
 */
export function createInMemoryRepositories(
  store: InMemoryStore = createEmptyStore(),
): Repositories {
  return {
    guilds: new InMemoryGuildRepository(store),
    adventures: new InMemoryAdventureRepository(store),
    sessions: new InMemorySessionRepository(store),
    adventurers: new InMemoryAdventurerRepository(store),
    adventurerEvents: new InMemoryAdventurerEventRepository(store),
    looseEnds: new InMemoryLooseEndRepository(store),
    storyPlans: new InMemoryStoryPlanRepository(store),
    npcs: new InMemoryNpcRepository(store),
    npcEvents: new InMemoryNpcEventRepository(store),
  };
}
