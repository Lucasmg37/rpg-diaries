import type { Firestore } from "firebase-admin/firestore";

import type {
  CreateLooseEndInput,
  LooseEnd,
  UpdateLooseEndInput,
} from "@/core/entities/loose-end";
import { NotFoundError } from "@/core/errors";
import type { LooseEndRepository } from "@/core/ports/loose-end-repository";
import { looseEndsCol } from "./firestore-client";
import { mapLooseEnd } from "./firestore-mappers";

export class FirestoreLooseEndRepository implements LooseEndRepository {
  constructor(private readonly db: Firestore) {}

  async listByAdventure(
    guildId: string,
    adventureId: string,
  ): Promise<LooseEnd[]> {
    const q = await looseEndsCol(this.db, guildId, adventureId).get();
    return q.docs.map(mapLooseEnd);
  }

  async create(input: CreateLooseEndInput): Promise<LooseEnd> {
    const ref = looseEndsCol(this.db, input.guildId, input.adventureId).doc();
    await ref.set({ ...input, id: ref.id });
    return { ...input, id: ref.id };
  }

  async update(
    guildId: string,
    adventureId: string,
    id: string,
    patch: UpdateLooseEndInput,
  ): Promise<LooseEnd> {
    const ref = looseEndsCol(this.db, guildId, adventureId).doc(id);
    const snap = await ref.get();
    if (!snap.exists)
      throw new NotFoundError(`Fio solto "${id}" não encontrado.`);
    await ref.set(patch, { merge: true });
    return { ...mapLooseEnd(snap as never), ...patch };
  }

  async delete(guildId: string, adventureId: string, id: string): Promise<void> {
    const ref = looseEndsCol(this.db, guildId, adventureId).doc(id);
    const snap = await ref.get();
    if (!snap.exists)
      throw new NotFoundError(`Fio solto "${id}" não encontrado.`);
    await ref.delete();
  }
}
