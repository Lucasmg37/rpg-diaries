import type { Firestore } from "firebase-admin/firestore";

import type { Guild } from "@/core/entities/guild";
import type { GuildRepository } from "@/core/ports/guild-repository";
import { guildDoc } from "./firestore-client";
import { mapGuild } from "./firestore-mappers";

export class FirestoreGuildRepository implements GuildRepository {
  constructor(private readonly db: Firestore) {}

  async getById(id: string): Promise<Guild | null> {
    const snap = await guildDoc(this.db, id).get();
    if (!snap.exists) return null;
    return mapGuild(snap as never);
  }
}
