import {
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Inicialização do Firebase Admin SDK a partir de variáveis de ambiente.
 * Mantém uma instância única (singleton) para evitar reinicializações em dev/HMR.
 */

/** Verifica se as credenciais do Firebase estão presentes no ambiente. */
export function isFirestoreConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  );
}

// Cache no globalThis: em dev o módulo pode ser reavaliado (HMR) e duplicar a
// instância, fazendo settings() ser chamado duas vezes (erro). O globalThis
// garante UMA instância por processo.
const globalForDb = globalThis as unknown as { __guildDb?: Firestore };

export function getDb(): Firestore {
  if (globalForDb.__guildDb) return globalForDb.__guildDb;

  if (!isFirestoreConfigured()) {
    throw new Error(
      "Firestore não configurado. Defina FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY.",
    );
  }

  const app: App =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // A chave privada vem com \n literais quando colada em env vars.
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      }),
    });

  const db = getFirestore(app);
  // Campos opcionais (ex.: closing, sessionNote) podem vir como undefined; o
  // Firestore os rejeitaria. Ignorá-los é mais simples que limpar cada payload.
  db.settings({ ignoreUndefinedProperties: true });
  globalForDb.__guildDb = db;
  return db;
}

// ---- Helpers de caminho (estrutura aninhada no Firestore) ----

export const guildsCol = (db: Firestore) => db.collection("guilds");
export const guildDoc = (db: Firestore, guildId: string) =>
  guildsCol(db).doc(guildId);

export const adventuresCol = (db: Firestore, guildId: string) =>
  guildDoc(db, guildId).collection("adventures");
export const adventureDoc = (
  db: Firestore,
  guildId: string,
  adventureId: string,
) => adventuresCol(db, guildId).doc(adventureId);

export const sessionsCol = (
  db: Firestore,
  guildId: string,
  adventureId: string,
) => adventureDoc(db, guildId, adventureId).collection("sessions");

export const adventurersCol = (
  db: Firestore,
  guildId: string,
  adventureId: string,
) => adventureDoc(db, guildId, adventureId).collection("adventurers");

export const looseEndsCol = (
  db: Firestore,
  guildId: string,
  adventureId: string,
) => adventureDoc(db, guildId, adventureId).collection("looseEnds");
