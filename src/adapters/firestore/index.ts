import type { Firestore } from "firebase-admin/firestore";

import type { Repositories } from "@/core/ports";
import { FirestoreAdventureRepository } from "./firestore-adventure.repository";
import { FirestoreAdventurerRepository } from "./firestore-adventurer.repository";
import { FirestoreAdventurerEventRepository } from "./firestore-adventurer-event.repository";
import { FirestoreGuildRepository } from "./firestore-guild.repository";
import { FirestoreLooseEndRepository } from "./firestore-loose-end.repository";
import { FirestoreNpcRepository } from "./firestore-npc.repository";
import { FirestoreNpcEventRepository } from "./firestore-npc-event.repository";
import { FirestoreSessionRepository } from "./firestore-session.repository";
import { FirestoreStoryPlanRepository } from "./firestore-story-plan.repository";

export { getDb, isFirestoreConfigured } from "./firestore-client";

/** Monta o conjunto de Repositories sobre uma instância do Firestore. */
export function createFirestoreRepositories(db: Firestore): Repositories {
  return {
    guilds: new FirestoreGuildRepository(db),
    adventures: new FirestoreAdventureRepository(db),
    sessions: new FirestoreSessionRepository(db),
    adventurers: new FirestoreAdventurerRepository(db),
    adventurerEvents: new FirestoreAdventurerEventRepository(db),
    looseEnds: new FirestoreLooseEndRepository(db),
    storyPlans: new FirestoreStoryPlanRepository(db),
    npcs: new FirestoreNpcRepository(db),
    npcEvents: new FirestoreNpcEventRepository(db),
  };
}
