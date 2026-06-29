import { Timestamp, type Firestore } from "firebase-admin/firestore";

import type {
  CreateSessionInput,
  Session,
  TimelineEntry,
  UpdateSessionInput,
} from "@/core/entities/session";
import type { SessionParticipant } from "@/core/entities/session-participant";
import { NotFoundError } from "@/core/errors";
import type { SessionRepository } from "@/core/ports/session-repository";
import { sessionsCol } from "./firestore-client";
import { mapSession } from "./firestore-mappers";

/** Garante que o índice de inserção fique dentro de [0, length]. */
function clampIndex(index: number, length: number): number {
  return Math.max(0, Math.min(index, length));
}

export class FirestoreSessionRepository implements SessionRepository {
  constructor(private readonly db: Firestore) {}

  async getById(
    guildId: string,
    adventureId: string,
    id: string,
  ): Promise<Session | null> {
    const snap = await sessionsCol(this.db, guildId, adventureId).doc(id).get();
    if (!snap.exists) return null;
    return mapSession(snap as never);
  }

  async listByAdventure(
    guildId: string,
    adventureId: string,
  ): Promise<Session[]> {
    const q = await sessionsCol(this.db, guildId, adventureId).get();
    return q.docs.map(mapSession).sort((a, b) => a.number - b.number);
  }

  async create(input: CreateSessionInput): Promise<Session> {
    const ref = sessionsCol(this.db, input.guildId, input.adventureId).doc();
    const now = new Date();
    const ts = Timestamp.fromDate(now);
    await ref.set({ ...input, id: ref.id, createdAt: ts, updatedAt: ts });
    return { ...input, id: ref.id, createdAt: now, updatedAt: now };
  }

  async update(
    guildId: string,
    adventureId: string,
    id: string,
    patch: UpdateSessionInput,
  ): Promise<Session> {
    const ref = sessionsCol(this.db, guildId, adventureId).doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundError(`Sessão "${id}" não encontrada.`);

    const updatedAt = new Date();
    await ref.set(
      { ...patch, updatedAt: Timestamp.fromDate(updatedAt) },
      { merge: true },
    );
    return { ...mapSession(snap as never), ...patch, updatedAt };
  }

  async upsertTimelineEntry(
    guildId: string,
    adventureId: string,
    id: string,
    entry: TimelineEntry,
    position?: number,
  ): Promise<Session> {
    const ref = sessionsCol(this.db, guildId, adventureId).doc(id);
    return this.db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists)
        throw new NotFoundError(`Sessão "${id}" não encontrada.`);

      const session = mapSession(snap as never);
      const existingIndex = session.timeline.findIndex((e) => e.id === entry.id);
      const timeline = [...session.timeline];
      if (existingIndex >= 0) {
        timeline.splice(existingIndex, 1);
        const insertAt =
          position === undefined
            ? existingIndex
            : clampIndex(position, timeline.length);
        timeline.splice(insertAt, 0, entry);
      } else {
        const insertAt = clampIndex(position ?? timeline.length, timeline.length);
        timeline.splice(insertAt, 0, entry);
      }

      const updatedAt = new Date();
      tx.set(ref, { timeline, updatedAt: Timestamp.fromDate(updatedAt) }, { merge: true });
      return { ...session, timeline, updatedAt };
    });
  }

  async removeTimelineEntry(
    guildId: string,
    adventureId: string,
    id: string,
    entryId: string,
  ): Promise<Session> {
    const ref = sessionsCol(this.db, guildId, adventureId).doc(id);
    return this.db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists)
        throw new NotFoundError(`Sessão "${id}" não encontrada.`);

      const session = mapSession(snap as never);
      const timeline = session.timeline.filter((e) => e.id !== entryId);
      const updatedAt = new Date();
      tx.set(ref, { timeline, updatedAt: Timestamp.fromDate(updatedAt) }, { merge: true });
      return { ...session, timeline, updatedAt };
    });
  }

  async reorderTimelineEntries(
    guildId: string,
    adventureId: string,
    id: string,
    entryIds: string[],
  ): Promise<Session> {
    const ref = sessionsCol(this.db, guildId, adventureId).doc(id);
    return this.db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists)
        throw new NotFoundError(`Sessão "${id}" não encontrada.`);

      const session = mapSession(snap as never);
      const byId = new Map(session.timeline.map((e) => [e.id, e]));
      const reordered = entryIds
        .map((entryId) => byId.get(entryId))
        .filter((e): e is TimelineEntry => Boolean(e));
      const remaining = session.timeline.filter((e) => !entryIds.includes(e.id));
      const timeline = [...reordered, ...remaining];

      const updatedAt = new Date();
      tx.set(ref, { timeline, updatedAt: Timestamp.fromDate(updatedAt) }, { merge: true });
      return { ...session, timeline, updatedAt };
    });
  }

  async upsertParticipant(
    guildId: string,
    adventureId: string,
    id: string,
    participant: SessionParticipant,
  ): Promise<Session> {
    const ref = sessionsCol(this.db, guildId, adventureId).doc(id);
    return this.db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists)
        throw new NotFoundError(`Sessão "${id}" não encontrada.`);

      const session = mapSession(snap as never);
      const existingIndex = session.participants.findIndex(
        (p) => p.adventurerId === participant.adventurerId,
      );
      const participants = [...session.participants];
      if (existingIndex >= 0) {
        participants[existingIndex] = participant;
      } else {
        participants.push(participant);
      }

      const updatedAt = new Date();
      tx.set(
        ref,
        { participants, updatedAt: Timestamp.fromDate(updatedAt) },
        { merge: true },
      );
      return { ...session, participants, updatedAt };
    });
  }

  async removeParticipant(
    guildId: string,
    adventureId: string,
    id: string,
    adventurerId: string,
  ): Promise<Session> {
    const ref = sessionsCol(this.db, guildId, adventureId).doc(id);
    return this.db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists)
        throw new NotFoundError(`Sessão "${id}" não encontrada.`);

      const session = mapSession(snap as never);
      const participants = session.participants.filter(
        (p) => p.adventurerId !== adventurerId,
      );
      const updatedAt = new Date();
      tx.set(
        ref,
        { participants, updatedAt: Timestamp.fromDate(updatedAt) },
        { merge: true },
      );
      return { ...session, participants, updatedAt };
    });
  }

  async delete(
    guildId: string,
    adventureId: string,
    id: string,
  ): Promise<void> {
    const ref = sessionsCol(this.db, guildId, adventureId).doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundError(`Sessão "${id}" não encontrada.`);
    await ref.delete();
  }
}
