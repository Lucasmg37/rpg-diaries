import type { Firestore } from "firebase-admin/firestore";

import type {
  CreateNpcInput,
  Npc,
  NpcRepositoryPatch,
} from "@/core/entities/npc";
import { NotFoundError } from "@/core/errors";
import type { NpcRepository } from "@/core/ports/npc-repository";
import { npcsCol } from "./firestore-client";
import { mapNpc } from "./firestore-mappers";

export class FirestoreNpcRepository implements NpcRepository {
  constructor(private readonly db: Firestore) {}

  async listByAdventure(guildId: string, adventureId: string): Promise<Npc[]> {
    const q = await npcsCol(this.db, guildId, adventureId).get();
    return q.docs.map(mapNpc).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getById(
    guildId: string,
    adventureId: string,
    id: string,
  ): Promise<Npc | null> {
    const snap = await npcsCol(this.db, guildId, adventureId).doc(id).get();
    if (!snap.exists) return null;
    return mapNpc(snap as never);
  }

  async create(input: CreateNpcInput): Promise<Npc> {
    const ref = npcsCol(this.db, input.guildId, input.adventureId).doc();
    await ref.set({ ...input, id: ref.id });
    return { ...input, id: ref.id };
  }

  async update(
    guildId: string,
    adventureId: string,
    id: string,
    patch: NpcRepositoryPatch,
  ): Promise<Npc> {
    const ref = npcsCol(this.db, guildId, adventureId).doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundError(`NPC "${id}" não encontrado.`);
    await ref.set(patch, { merge: true });
    return { ...mapNpc(snap as never), ...patch };
  }

  async delete(guildId: string, adventureId: string, id: string): Promise<void> {
    const ref = npcsCol(this.db, guildId, adventureId).doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundError(`NPC "${id}" não encontrado.`);
    await ref.delete();
  }
}
