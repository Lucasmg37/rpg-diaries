import type { Firestore, Query } from "firebase-admin/firestore";

import type {
  AdventurerEvent,
  CreateAdventurerEventInput,
} from "@/core/entities/adventurer-event";
import { NotFoundError } from "@/core/errors";
import type {
  AdventurerEventRepository,
  EventQuery,
} from "@/core/ports/adventurer-event-repository";
import { adventurerEventsCol } from "./firestore-client";

function uniqueParticipants(actorId: string, targetIds?: string[]): string[] {
  return Array.from(new Set([actorId, ...(targetIds ?? [])]));
}

export class FirestoreAdventurerEventRepository
  implements AdventurerEventRepository
{
  constructor(private readonly db: Firestore) {}

  async appendEvent(
    guildId: string,
    adventureId: string,
    input: CreateAdventurerEventInput,
  ): Promise<AdventurerEvent> {
    const col = adventurerEventsCol(this.db, guildId, adventureId);
    const ref = col.doc();
    const event = {
      ...input,
      id: ref.id,
      participantIds: uniqueParticipants(input.actorId, input.targetIds),
      createdAt: new Date().toISOString(),
    } as AdventurerEvent;
    await ref.set(event);
    return event;
  }

  async listEvents(
    guildId: string,
    adventureId: string,
    query: EventQuery = {},
  ): Promise<AdventurerEvent[]> {
    let q: Query = adventurerEventsCol(this.db, guildId, adventureId);

    if (query.adventurerId) {
      q = q.where("participantIds", "array-contains", query.adventurerId);
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
    let events = snap.docs.map((d) => d.data() as AdventurerEvent);

    // Filtros sem índice composto direto: aplicados em memória.
    if (query.types?.length) {
      events = events.filter((e) => query.types!.includes(e.type));
    }

    return events.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  }

  async retconEvent(
    guildId: string,
    adventureId: string,
    targetEventId: string,
    correction: CreateAdventurerEventInput,
  ): Promise<AdventurerEvent> {
    const col = adventurerEventsCol(this.db, guildId, adventureId);
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
      participantIds: uniqueParticipants(
        correction.actorId,
        correction.targetIds,
      ),
      createdAt: new Date().toISOString(),
    } as AdventurerEvent;

    await this.db.runTransaction(async (tx) => {
      tx.set(correctionRef, correctionEvent);
      tx.update(targetRef, { retconnedBy: correctionRef.id });
    });

    return correctionEvent;
  }
}
