import { randomUUID } from "node:crypto";

import { NotFoundError } from "@/core/errors";
import type { Adventure } from "@/core/entities/adventure";
import type {
  Adventurer,
  CreateAdventurerInput,
  UpdateAdventurerInput,
} from "@/core/entities/adventurer";
import type { Guild } from "@/core/entities/guild";
import type {
  CreateLooseEndInput,
  LooseEnd,
  UpdateLooseEndInput,
} from "@/core/entities/loose-end";
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
  AdventurerRepository,
  GuildRepository,
  LooseEndRepository,
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
  looseEnds: Map<string, LooseEnd>;
  storyPlans: Map<string, StoryPlan>;
}

export function createEmptyStore(): InMemoryStore {
  return {
    guilds: new Map(),
    adventures: new Map(),
    sessions: new Map(),
    adventurers: new Map(),
    looseEnds: new Map(),
    storyPlans: new Map(),
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
    patch: UpdateAdventurerInput,
  ): Promise<Adventurer> {
    const existing = this.store.adventurers.get(id);
    if (!existing) throw new NotFoundError(`Aventureiro "${id}" não encontrado.`);
    const updated: Adventurer = { ...existing, ...patch };
    this.store.adventurers.set(id, updated);
    return updated;
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
    looseEnds: new InMemoryLooseEndRepository(store),
    storyPlans: new InMemoryStoryPlanRepository(store),
  };
}
