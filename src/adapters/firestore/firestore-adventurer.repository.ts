import type { Firestore } from "firebase-admin/firestore";

import type {
  Adventurer,
  CreateAdventurerInput,
  UpdateAdventurerInput,
} from "@/core/entities/adventurer";
import { NotFoundError } from "@/core/errors";
import type { AdventurerRepository } from "@/core/ports/adventurer-repository";
import { adventurersCol } from "./firestore-client";
import { mapAdventurer } from "./firestore-mappers";

export class FirestoreAdventurerRepository implements AdventurerRepository {
  constructor(private readonly db: Firestore) {}

  async listByAdventure(
    guildId: string,
    adventureId: string,
  ): Promise<Adventurer[]> {
    const q = await adventurersCol(this.db, guildId, adventureId).get();
    return q.docs
      .map(mapAdventurer)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async create(input: CreateAdventurerInput): Promise<Adventurer> {
    const ref = adventurersCol(this.db, input.guildId, input.adventureId).doc();
    await ref.set({ ...input, id: ref.id });
    return { ...input, id: ref.id };
  }

  async update(
    guildId: string,
    adventureId: string,
    id: string,
    patch: UpdateAdventurerInput,
  ): Promise<Adventurer> {
    const ref = adventurersCol(this.db, guildId, adventureId).doc(id);
    const snap = await ref.get();
    if (!snap.exists)
      throw new NotFoundError(`Aventureiro "${id}" não encontrado.`);
    await ref.set(patch, { merge: true });
    return { ...mapAdventurer(snap as never), ...patch };
  }
}
