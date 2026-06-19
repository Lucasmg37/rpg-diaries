import { Timestamp, type Firestore } from "firebase-admin/firestore";

import type {
  CreateSessionInput,
  Session,
  UpdateSessionInput,
} from "@/core/entities/session";
import type { SessionRepository } from "@/core/ports/session-repository";
import { sessionsCol } from "./firestore-client";
import { mapSession } from "./firestore-mappers";

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
    if (!snap.exists) throw new Error(`Sessão "${id}" não encontrada.`);

    const updatedAt = new Date();
    await ref.set(
      { ...patch, updatedAt: Timestamp.fromDate(updatedAt) },
      { merge: true },
    );
    return { ...mapSession(snap as never), ...patch, updatedAt };
  }
}
