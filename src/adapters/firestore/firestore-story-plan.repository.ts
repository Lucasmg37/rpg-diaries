import { randomUUID } from "node:crypto";

import { Timestamp, type Firestore } from "firebase-admin/firestore";

import type {
  CreateStoryNoteInput,
  CreateStoryPlanInput,
  StoryNote,
  StoryPlan,
  UpdateStoryPlanInput,
} from "@/core/entities/story-plan";
import { NotFoundError } from "@/core/errors";
import type { StoryPlanRepository } from "@/core/ports/story-plan-repository";
import { storyPlansCol } from "./firestore-client";
import { mapStoryPlan } from "./firestore-mappers";

export class FirestoreStoryPlanRepository implements StoryPlanRepository {
  constructor(private readonly db: Firestore) {}

  async getById(
    guildId: string,
    adventureId: string,
    id: string,
  ): Promise<StoryPlan | null> {
    const snap = await storyPlansCol(this.db, guildId, adventureId)
      .doc(id)
      .get();
    if (!snap.exists) return null;
    return mapStoryPlan(snap as never);
  }

  async listByAdventure(
    guildId: string,
    adventureId: string,
  ): Promise<StoryPlan[]> {
    const q = await storyPlansCol(this.db, guildId, adventureId).get();
    return q.docs.map(mapStoryPlan).sort((a, b) => a.order - b.order);
  }

  async create(input: CreateStoryPlanInput): Promise<StoryPlan> {
    const ref = storyPlansCol(this.db, input.guildId, input.adventureId).doc();
    const now = new Date();
    const ts = Timestamp.fromDate(now);
    await ref.set({
      ...input,
      id: ref.id,
      liveNotes: [],
      createdAt: ts,
      updatedAt: ts,
    });
    return { ...input, id: ref.id, liveNotes: [], createdAt: now, updatedAt: now };
  }

  async update(
    guildId: string,
    adventureId: string,
    id: string,
    patch: UpdateStoryPlanInput,
  ): Promise<StoryPlan> {
    const ref = storyPlansCol(this.db, guildId, adventureId).doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundError(`Roteiro "${id}" não encontrado.`);

    const updatedAt = new Date();
    await ref.set(
      { ...patch, updatedAt: Timestamp.fromDate(updatedAt) },
      { merge: true },
    );
    return { ...mapStoryPlan(snap as never), ...patch, updatedAt };
  }

  async addNote(
    guildId: string,
    adventureId: string,
    id: string,
    note: CreateStoryNoteInput,
  ): Promise<StoryPlan> {
    const ref = storyPlansCol(this.db, guildId, adventureId).doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundError(`Roteiro "${id}" não encontrado.`);

    const plan = mapStoryPlan(snap as never);
    const created: StoryNote = {
      id: randomUUID(),
      body: note.body,
      sceneId: note.sceneId,
      createdAt: new Date(),
    };
    const liveNotes = [...plan.liveNotes, created];
    const updatedAt = new Date();
    await ref.set(
      { liveNotes, updatedAt: Timestamp.fromDate(updatedAt) },
      { merge: true },
    );
    return { ...plan, liveNotes, updatedAt };
  }
}
