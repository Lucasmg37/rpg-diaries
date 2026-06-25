/**
 * Backup completo do Firestore (toda a árvore guilds/{g}/adventures/{a}/...)
 * para um arquivo JSON local, antes de qualquer migração estrutural.
 *
 * Rodar: npm run backup:firestore
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import {
  getDb,
  isFirestoreConfigured,
  guildsCol,
} from "@/adapters/firestore/firestore-client";
import type { Firestore, CollectionReference } from "firebase-admin/firestore";

async function dumpCollection(col: CollectionReference) {
  const snap = await col.get();
  const docs: Record<string, unknown> = {};
  for (const doc of snap.docs) {
    docs[doc.id] = doc.data();
  }
  return docs;
}

async function dumpAdventure(db: Firestore, guildId: string, adventureId: string) {
  const adventureDoc = await guildsCol(db)
    .doc(guildId)
    .collection("adventures")
    .doc(adventureId)
    .get();
  const base = guildsCol(db).doc(guildId).collection("adventures").doc(adventureId);

  return {
    data: adventureDoc.data(),
    sessions: await dumpCollection(base.collection("sessions")),
    adventurers: await dumpCollection(base.collection("adventurers")),
    looseEnds: await dumpCollection(base.collection("looseEnds")),
    storyPlans: await dumpCollection(base.collection("storyPlans")),
    adventurerEvents: await dumpCollection(base.collection("adventurerEvents")),
    npcs: await dumpCollection(base.collection("npcs")),
    npcEvents: await dumpCollection(base.collection("npcEvents")),
  };
}

async function main() {
  if (!isFirestoreConfigured()) {
    console.error(
      "❌ Firestore não configurado. Defina FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY.",
    );
    process.exit(1);
  }

  const db = getDb();
  const guildsSnap = await guildsCol(db).get();

  const backup: Record<string, unknown> = {};

  for (const guildDoc of guildsSnap.docs) {
    const guildId = guildDoc.id;
    const adventuresSnap = await guildsCol(db)
      .doc(guildId)
      .collection("adventures")
      .get();

    const adventures: Record<string, unknown> = {};
    for (const advDoc of adventuresSnap.docs) {
      adventures[advDoc.id] = await dumpAdventure(db, guildId, advDoc.id);
    }

    backup[guildId] = {
      data: guildDoc.data(),
      adventures,
    };
  }

  const dir = join(process.cwd(), "backups");
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const path = join(dir, `firestore-backup-${stamp}.json`);

  writeFileSync(path, JSON.stringify(backup, null, 2), "utf-8");

  const guildCount = Object.keys(backup).length;
  console.log(`✅ Backup salvo em ${path}`);
  console.log(`   ${guildCount} guild(s) exportada(s).`);
}

main().catch((err) => {
  console.error("❌ Falha no backup:", err);
  process.exit(1);
});
