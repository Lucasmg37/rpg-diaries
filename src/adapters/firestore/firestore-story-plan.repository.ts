import { randomUUID } from "node:crypto";

import { Timestamp, type Firestore } from "firebase-admin/firestore";

import type {
  CreateStoryNoteInput,
  CreateStoryPlanInput,
  Scene,
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

  async upsertScene(
    guildId: string,
    adventureId: string,
    id: string,
    scene: Scene,
    position?: number,
  ): Promise<StoryPlan> {
    const ref = storyPlansCol(this.db, guildId, adventureId).doc(id);
    return this.db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists)
        throw new NotFoundError(`Roteiro "${id}" não encontrado.`);

      const plan = mapStoryPlan(snap as never);
      const existingIndex = plan.scenes.findIndex((s) => s.id === scene.id);
      const scenes = [...plan.scenes];
      if (existingIndex >= 0) {
        scenes.splice(existingIndex, 1);
        const insertAt =
          position === undefined
            ? existingIndex
            : clampIndex(position, scenes.length);
        scenes.splice(insertAt, 0, scene);
      } else {
        const insertAt = clampIndex(position ?? scenes.length, scenes.length);
        scenes.splice(insertAt, 0, scene);
      }

      const updatedAt = new Date();
      tx.set(ref, { scenes, updatedAt: Timestamp.fromDate(updatedAt) }, { merge: true });
      return { ...plan, scenes, updatedAt };
    });
  }

  async removeScene(
    guildId: string,
    adventureId: string,
    id: string,
    sceneId: string,
  ): Promise<StoryPlan> {
    const ref = storyPlansCol(this.db, guildId, adventureId).doc(id);
    return this.db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists)
        throw new NotFoundError(`Roteiro "${id}" não encontrado.`);

      const plan = mapStoryPlan(snap as never);
      const scenes = plan.scenes.filter((s) => s.id !== sceneId);
      const updatedAt = new Date();
      tx.set(ref, { scenes, updatedAt: Timestamp.fromDate(updatedAt) }, { merge: true });
      return { ...plan, scenes, updatedAt };
    });
  }

  async reorderScenes(
    guildId: string,
    adventureId: string,
    id: string,
    sceneIds: string[],
  ): Promise<StoryPlan> {
    const ref = storyPlansCol(this.db, guildId, adventureId).doc(id);
    return this.db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists)
        throw new NotFoundError(`Roteiro "${id}" não encontrado.`);

      const plan = mapStoryPlan(snap as never);
      const byId = new Map(plan.scenes.map((s) => [s.id, s]));
      const reordered = sceneIds
        .map((sceneId) => byId.get(sceneId))
        .filter((s): s is Scene => Boolean(s));
      const remaining = plan.scenes.filter((s) => !sceneIds.includes(s.id));
      const scenes = [...reordered, ...remaining];

      const updatedAt = new Date();
      tx.set(ref, { scenes, updatedAt: Timestamp.fromDate(updatedAt) }, { merge: true });
      return { ...plan, scenes, updatedAt };
    });
  }

  async delete(
    guildId: string,
    adventureId: string,
    id: string,
  ): Promise<void> {
    const ref = storyPlansCol(this.db, guildId, adventureId).doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundError(`Roteiro "${id}" não encontrado.`);
    await ref.delete();
  }
}

/** Garante que o índice de inserção fique dentro de [0, length]. */
function clampIndex(index: number, length: number): number {
  return Math.max(0, Math.min(index, length));
}
