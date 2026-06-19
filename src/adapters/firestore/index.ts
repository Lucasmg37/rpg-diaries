import type { Firestore } from "firebase-admin/firestore";

import type { Repositories } from "@/core/ports";
import { FirestoreAdventureRepository } from "./firestore-adventure.repository";
import { FirestoreAdventurerRepository } from "./firestore-adventurer.repository";
import { FirestoreGuildRepository } from "./firestore-guild.repository";
import { FirestoreLooseEndRepository } from "./firestore-loose-end.repository";
import { FirestoreSessionRepository } from "./firestore-session.repository";

export { getDb, isFirestoreConfigured } from "./firestore-client";

/** Monta o conjunto de Repositories sobre uma instância do Firestore. */
export function createFirestoreRepositories(db: Firestore): Repositories {
  return {
    guilds: new FirestoreGuildRepository(db),
    adventures: new FirestoreAdventureRepository(db),
    sessions: new FirestoreSessionRepository(db),
    adventurers: new FirestoreAdventurerRepository(db),
    looseEnds: new FirestoreLooseEndRepository(db),
  };
}
