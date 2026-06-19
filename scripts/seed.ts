/**
 * Seed da Fase 2 — popula o Firestore real com os dados de exemplo.
 *
 * Estrutura criada:
 *   Guild -> Adventure -> 2 Sessions + 5 Adventurers + 4 Loose Ends
 *
 * Idempotente: usa `set` com IDs determinísticos (de sample-data), então pode
 * rodar várias vezes sem duplicar.
 *
 * Rodar: npm run seed   (requer credenciais do Firebase em .env.local)
 */
import { Timestamp } from "firebase-admin/firestore";

import {
  adventureDoc,
  adventurersCol,
  getDb,
  guildDoc,
  isFirestoreConfigured,
  looseEndsCol,
  sessionsCol,
  storyPlansCol,
} from "@/adapters/firestore/firestore-client";
import {
  sampleAdventurers,
  sampleAdventures,
  sampleGuild,
  sampleLooseEnds,
  sampleSessions,
  sampleStoryPlans,
} from "@/lib/sample-data";

async function main() {
  if (!isFirestoreConfigured()) {
    console.error(
      "❌ Firestore não configurado. Defina FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY em .env.local.",
    );
    process.exit(1);
  }

  const db = getDb();
  const batch = db.batch();

  // Guild
  batch.set(guildDoc(db, sampleGuild.id), {
    id: sampleGuild.id,
    name: sampleGuild.name,
    slug: sampleGuild.slug,
    description: sampleGuild.description,
    masterId: sampleGuild.masterId,
    createdAt: Timestamp.fromDate(sampleGuild.createdAt),
  });

  // Adventures
  for (const a of sampleAdventures) {
    batch.set(adventureDoc(db, a.guildId, a.id), {
      id: a.id,
      guildId: a.guildId,
      name: a.name,
      slug: a.slug,
      description: a.description,
      order: a.order,
      createdAt: Timestamp.fromDate(a.createdAt),
    });
  }

  // Adventurers
  for (const adv of sampleAdventurers) {
    batch.set(adventurersCol(db, adv.guildId, adv.adventureId).doc(adv.id), {
      ...adv,
    });
  }

  // Loose ends
  for (const le of sampleLooseEnds) {
    batch.set(looseEndsCol(db, le.guildId, le.adventureId).doc(le.id), {
      ...le,
    });
  }

  // Sessions
  for (const s of sampleSessions) {
    batch.set(sessionsCol(db, s.guildId, s.adventureId).doc(s.id), {
      ...s,
      createdAt: Timestamp.fromDate(s.createdAt),
      updatedAt: Timestamp.fromDate(s.updatedAt),
    });
  }

  // Story plans (roteiros do mestre)
  for (const p of sampleStoryPlans) {
    batch.set(storyPlansCol(db, p.guildId, p.adventureId).doc(p.id), {
      ...p,
      liveNotes: p.liveNotes.map((n) => ({
        ...n,
        createdAt: Timestamp.fromDate(n.createdAt),
      })),
      createdAt: Timestamp.fromDate(p.createdAt),
      updatedAt: Timestamp.fromDate(p.updatedAt),
    });
  }

  await batch.commit();

  console.log("✅ Seed concluído no Firestore:");
  console.log(`   Guild: ${sampleGuild.name} (${sampleGuild.id})`);
  console.log(`   Aventuras: ${sampleAdventures.length}`);
  console.log(`   Sessões: ${sampleSessions.length}`);
  console.log(`   Aventureiros: ${sampleAdventurers.length}`);
  console.log(`   Fios soltos: ${sampleLooseEnds.length}`);
  console.log(`   Roteiros do mestre: ${sampleStoryPlans.length}`);
}

main().catch((err) => {
  console.error("❌ Falha no seed:", err);
  process.exit(1);
});
