import type { Firestore, Query } from "firebase-admin/firestore";

import type {
  CreateNpcEventInput,
  NpcEvent,
} from "@/core/entities/npc-event";
import { NotFoundError } from "@/core/errors";
import type {
  NpcEventQuery,
  NpcEventRepository,
} from "@/core/ports/npc-event-repository";
import { npcEventsCol } from "./firestore-client";

export class FirestoreNpcEventRepository implements NpcEventRepository {
  constructor(private readonly db: Firestore) {}

  async appendEvent(
    guildId: string,
    adventureId: string,
    input: CreateNpcEventInput,
  ): Promise<NpcEvent> {
    const col = npcEventsCol(this.db, guildId, adventureId);
    const ref = col.doc();
    const event = {
      ...input,
      id: ref.id,
      createdAt: new Date().toISOString(),
    } as NpcEvent;
    await ref.set(event);
    return event;
  }

  async listEvents(
    guildId: string,
    adventureId: string,
    query: NpcEventQuery = {},
  ): Promise<NpcEvent[]> {
    let q: Query = npcEventsCol(this.db, guildId, adventureId);

    if (query.npcId) {
      q = q.where("npcId", "==", query.npcId);
    }
    if (query.sessionId) {
      q = q.where("sessionId", "==", query.sessionId);
    }
    if (query.arcId) {
      q = q.where("arcId", "==", query.arcId);
    }
    if (query.visibility) {
      q = q.where("visibility", "==", query.visibility);
    }
    if (query.since) {
      q = q.where("occurredAt", ">=", query.since);
    }
    if (query.until) {
      q = q.where("occurredAt", "<=", query.until);
    }

    const snap = await q.get();
    let events = snap.docs.map((d) => d.data() as NpcEvent);

    if (query.types?.length) {
      events = events.filter((e) => query.types!.includes(e.type));
    }

    return events.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  }

  async retconEvent(
    guildId: string,
    adventureId: string,
    targetEventId: string,
    correction: CreateNpcEventInput,
  ): Promise<NpcEvent> {
    const col = npcEventsCol(this.db, guildId, adventureId);
    const targetRef = col.doc(targetEventId);
    const targetSnap = await targetRef.get();
    if (!targetSnap.exists) {
      throw new NotFoundError(`Evento "${targetEventId}" não encontrado.`);
    }

    const correctionRef = col.doc();
    const correctionEvent = {
      ...correction,
      id: correctionRef.id,
      retcons: targetEventId,
      createdAt: new Date().toISOString(),
    } as NpcEvent;

    await this.db.runTransaction(async (tx) => {
      tx.set(correctionRef, correctionEvent);
      tx.update(targetRef, { retconnedBy: correctionRef.id });
    });

    return correctionEvent;
  }
}
