import type { Repositories } from "@/core/ports";
import {
  createInMemoryRepositories,
} from "@/adapters/in-memory/in-memory.repository";
import {
  createFirestoreRepositories,
  getDb,
  isFirestoreConfigured,
} from "@/adapters/firestore";
import { buildSampleStore } from "@/lib/sample-data";

/**
 * ÚNICO ponto do código que decide qual adapter usar. Todo o resto do app
 * depende apenas da interface `Repositories`.
 *
 * - Credenciais do Firebase presentes  -> adapter Firestore (produção / build real).
 * - Sem credenciais                     -> adapter in-memory com os dados de
 *   exemplo (permite desenvolver e rodar `npm run build` nas Fases 1-3 sem
 *   depender do Firestore ainda).
 */
let cached: Repositories | null = null;

export function getRepositories(): Repositories {
  if (cached) return cached;

  if (isFirestoreConfigured()) {
    cached = createFirestoreRepositories(getDb());
  } else {
    cached = createInMemoryRepositories(buildSampleStore());
  }
  return cached;
}

/** Indica se o app está rodando com dados de exemplo (in-memory). */
export function isUsingSampleData(): boolean {
  return !isFirestoreConfigured();
}
