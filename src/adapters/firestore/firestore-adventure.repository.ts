import { Timestamp, type Firestore } from "firebase-admin/firestore";

import type {
  Adventure,
  CreateAdventureInput,
  UpdateAdventureInput,
} from "@/core/entities/adventure";
import { NotFoundError } from "@/core/errors";
import type { AdventureRepository } from "@/core/ports/adventure-repository";
import { adventureDoc, adventuresCol } from "./firestore-client";
import { mapAdventure } from "./firestore-mappers";

export class FirestoreAdventureRepository implements AdventureRepository {
  constructor(private readonly db: Firestore) {}

  async getById(guildId: string, id: string): Promise<Adventure | null> {
    const snap = await adventureDoc(this.db, guildId, id).get();
    if (!snap.exists) return null;
    return mapAdventure(snap as never);
  }

  async listByGuild(guildId: string): Promise<Adventure[]> {
    const q = await adventuresCol(this.db, guildId).orderBy("order").get();
    return q.docs.map(mapAdventure);
  }

  async create(input: CreateAdventureInput): Promise<Adventure> {
    const ref = adventuresCol(this.db, input.guildId).doc();
    const createdAt = new Date();
    await ref.set({
      ...input,
      id: ref.id,
      createdAt: Timestamp.fromDate(createdAt),
    });
    return { ...input, id: ref.id, createdAt };
  }

  async update(
    guildId: string,
    id: string,
    patch: UpdateAdventureInput,
  ): Promise<Adventure> {
    const ref = adventureDoc(this.db, guildId, id);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundError(`Aventura "${id}" não encontrada.`);
    await ref.set(patch, { merge: true });
    return { ...mapAdventure(snap as never), ...patch };
  }

  async delete(guildId: string, id: string): Promise<void> {
    const ref = adventureDoc(this.db, guildId, id);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundError(`Aventura "${id}" não encontrada.`);
    await ref.delete();
  }
}
