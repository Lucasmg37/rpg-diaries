import type { Firestore } from "firebase-admin/firestore";

import type { Adventure } from "@/core/entities/adventure";
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
}
