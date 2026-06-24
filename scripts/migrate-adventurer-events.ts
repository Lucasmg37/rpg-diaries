/**
 * Migração retroativa (Fase 1, item 9.1 do plano): gera os eventos `joined` +
 * `level_up` + `death` + `relationship` + `item_gained` + `title_badge` +
 * `state_flag` correspondentes às Sessões 1–3 já registradas, e recomputa o
 * snapshot de cada aventureiro a partir deles.
 *
 * Idempotência: falha alto e cedo se já existir QUALQUER evento na aventura —
 * para rodar de novo, é preciso limpar `adventurerEvents` primeiro (ou usar um
 * adventureId de teste). Isso evita duplicar a timeline em re-execuções.
 *
 * Rodar: npm run migrate:adventurer-events
 */
import { getMasterGuildId } from "@/adapters/config/master-config";
import { getRepositories, isUsingSampleData } from "@/adapters/config/repository-factory";
import type { CreateAdventurerEventInput } from "@/core/entities/adventurer-event";
import { rebuildSnapshot } from "@/core/usecases/append-adventurer-event";

const ADVENTURE_ID = "adv-cronica";

const SESSION_1_AT = "2025-02-05T20:00:00.000Z"; // sess-01 (createdAt real)
const SESSION_2_AT = "2025-02-12T20:00:00.000Z"; // sess-02
const SESSION_3_AT = "2026-01-20T20:01:00.000Z"; // sess-03 (bGrLeGpKyU75EHQN5Wog)

async function main() {
  if (isUsingSampleData()) {
    console.error("❌ Esperava Firestore. Rode com as credenciais em .env.local.");
    process.exit(1);
  }

  const repos = getRepositories();
  const guildId = getMasterGuildId();

  const existing = await repos.adventurerEvents.listEvents(guildId, ADVENTURE_ID);
  if (existing.length > 0) {
    console.error(
      `❌ Já existem ${existing.length} evento(s) em "${ADVENTURE_ID}". Migração não é idempotente — abortando para não duplicar a timeline.`,
    );
    process.exit(1);
  }

  const events: CreateAdventurerEventInput[] = [
    // --- entrada na crônica (nível 1, antes da Sessão 1) ---
    {
      guildId,
      adventureId: ADVENTURE_ID,
      actorId: "adv-valerius",
      sessionId: null,
      occurredAt: SESSION_1_AT,
      sequence: 0,
      title: "Entrou na crônica",
      visibility: "player",
      type: "joined",
      initialClasses: [{ className: "Guerreiro", levels: 1 }],
    },
    {
      guildId,
      adventureId: ADVENTURE_ID,
      actorId: "adv-gutsen",
      sessionId: null,
      occurredAt: SESSION_1_AT,
      sequence: 0,
      title: "Entrou na crônica",
      visibility: "player",
      type: "joined",
      initialClasses: [{ className: "Bárbaro", levels: 1 }],
    },
    {
      guildId,
      adventureId: ADVENTURE_ID,
      actorId: "adv-nyxx",
      sessionId: null,
      occurredAt: SESSION_1_AT,
      sequence: 0,
      title: "Entrou na crônica",
      visibility: "player",
      type: "joined",
      initialClasses: [{ className: "Mago", levels: 1 }],
    },
    {
      guildId,
      adventureId: ADVENTURE_ID,
      actorId: "adv-zephyron",
      sessionId: null,
      occurredAt: SESSION_1_AT,
      sequence: 0,
      title: "Entrou na crônica",
      visibility: "player",
      type: "joined",
      initialClasses: [{ className: "Ladino", levels: 1 }],
    },

    // --- Sessão 1: "↑ Nv. 2" para Valerius, Gutsen, Zephyron; Nyxx fica suspeito ---
    {
      guildId,
      adventureId: ADVENTURE_ID,
      actorId: "adv-valerius",
      sessionId: "sess-01",
      occurredAt: SESSION_1_AT,
      sequence: 1,
      title: "Subiu para o nível 2",
      visibility: "player",
      type: "level_up",
      className: "Guerreiro",
      fromLevel: 1,
      toLevel: 2,
    },
    {
      guildId,
      adventureId: ADVENTURE_ID,
      actorId: "adv-gutsen",
      sessionId: "sess-01",
      occurredAt: SESSION_1_AT,
      sequence: 1,
      title: "Subiu para o nível 2",
      visibility: "player",
      type: "level_up",
      className: "Bárbaro",
      fromLevel: 1,
      toLevel: 2,
    },
    {
      guildId,
      adventureId: ADVENTURE_ID,
      actorId: "adv-zephyron",
      sessionId: "sess-01",
      occurredAt: SESSION_1_AT,
      sequence: 1,
      title: "Subiu para o nível 2",
      visibility: "player",
      type: "level_up",
      className: "Ladino",
      fromLevel: 1,
      toLevel: 2,
    },
    {
      guildId,
      adventureId: ADVENTURE_ID,
      actorId: "adv-nyxx",
      sessionId: "sess-01",
      occurredAt: SESSION_1_AT,
      sequence: 1,
      title: "Subiu para o nível 2",
      visibility: "player",
      type: "level_up",
      className: "Mago",
      fromLevel: 1,
      toLevel: 2,
    },
    {
      guildId,
      adventureId: ADVENTURE_ID,
      actorId: "adv-nyxx",
      sessionId: "sess-01",
      occurredAt: SESSION_1_AT,
      sequence: 1,
      title: "Ausentou-se da cerimônia",
      body: "Mentiu sobre a invocação descontrolada.",
      visibility: "player",
      type: "state_flag",
      to: "suspicious",
    },

    // --- Sessão 2: morte de Zephyron, Kael ingressa já no nível 2 ---
    {
      guildId,
      adventureId: ADVENTURE_ID,
      actorId: "adv-zephyron",
      sessionId: "sess-02",
      occurredAt: SESSION_2_AT,
      title: "Tombou na segunda onda de zumbis",
      body: "Morreu no retorno da escolta.",
      visibility: "player",
      type: "death",
    },
    {
      guildId,
      adventureId: ADVENTURE_ID,
      actorId: "adv-kael",
      sessionId: "sess-02",
      occurredAt: SESSION_2_AT,
      title: "Ingressou no grupo",
      body: "Recrutado após a morte de Zephyron — criticou o grupo por não ter um curador.",
      visibility: "player",
      type: "joined",
      initialClasses: [{ className: "Clérigo", levels: 2 }],
    },

    // --- Sessão 3: "↑ Nv. 3" para Gutsen, Kael, Nyxx, Valerius ---
    {
      guildId,
      adventureId: ADVENTURE_ID,
      actorId: "adv-gutsen",
      sessionId: "bGrLeGpKyU75EHQN5Wog",
      occurredAt: SESSION_3_AT,
      title: "Subiu para o nível 3",
      visibility: "player",
      type: "level_up",
      className: "Bárbaro",
      fromLevel: 2,
      toLevel: 3,
    },
    {
      guildId,
      adventureId: ADVENTURE_ID,
      actorId: "adv-kael",
      sessionId: "bGrLeGpKyU75EHQN5Wog",
      occurredAt: SESSION_3_AT,
      title: "Subiu para o nível 3",
      visibility: "player",
      type: "level_up",
      className: "Clérigo",
      fromLevel: 2,
      toLevel: 3,
    },
    {
      guildId,
      adventureId: ADVENTURE_ID,
      actorId: "adv-nyxx",
      sessionId: "bGrLeGpKyU75EHQN5Wog",
      occurredAt: SESSION_3_AT,
      title: "Subiu para o nível 3",
      visibility: "player",
      type: "level_up",
      className: "Mago",
      fromLevel: 2,
      toLevel: 3,
    },
    {
      guildId,
      adventureId: ADVENTURE_ID,
      actorId: "adv-valerius",
      sessionId: "bGrLeGpKyU75EHQN5Wog",
      occurredAt: SESSION_3_AT,
      title: "Subiu para o nível 3",
      visibility: "player",
      type: "level_up",
      className: "Guerreiro",
      fromLevel: 2,
      toLevel: 3,
    },

    // --- itens ganhos na Sessão 3 ---
    {
      guildId,
      adventureId: ADVENTURE_ID,
      actorId: "adv-kael",
      sessionId: "bGrLeGpKyU75EHQN5Wog",
      occurredAt: SESSION_3_AT,
      title: "Tomou para si um livro proibido",
      body: "Encontrado na casa de Eloá.",
      visibility: "player",
      relatedLooseEndIds: ["dNUITvHSQlb41FEXcGnl"],
      type: "item_gained",
      item: { id: "item-livro-proibido-kael", name: "Livro Proibido de Kael" },
    },
    {
      guildId,
      adventureId: ADVENTURE_ID,
      actorId: "adv-gutsen",
      sessionId: "bGrLeGpKyU75EHQN5Wog",
      occurredAt: SESSION_3_AT,
      title: "Guardou uma mecha do cabelo de Eloá",
      visibility: "player",
      relatedLooseEndIds: ["nRAtOdH7o0xwWAriJHCF"],
      type: "item_gained",
      item: { id: "item-mecha-eloa", name: "Mecha de Eloá" },
    },

    // --- o soco: evento único cross-character (Valerius -> Nyxx) ---
    {
      guildId,
      adventureId: ADVENTURE_ID,
      actorId: "adv-valerius",
      targetIds: ["adv-nyxx"],
      sessionId: "bGrLeGpKyU75EHQN5Wog",
      occurredAt: SESSION_3_AT,
      sequence: 1,
      title: "Socou Nyxx por ocultar a ligação com o grimório",
      body: "Desde a biblioteca, Valerius suspeitava — confrontou e agrediu Nyxx.",
      visibility: "player",
      relatedLooseEndIds: ["1Gm5WLBRBvcfnIW99k42"],
      type: "relationship",
      nature: "conflict",
    },
    {
      guildId,
      adventureId: ADVENTURE_ID,
      actorId: "adv-nyxx",
      sessionId: "bGrLeGpKyU75EHQN5Wog",
      occurredAt: SESSION_3_AT,
      sequence: 2,
      title: "Exposto",
      body: "Tentou revelar a ligação com seu grimório e levou um soco. Desconfia de Ezequias.",
      visibility: "player",
      type: "state_flag",
      to: "suspicious",
    },

    // --- títulos contextuais da Sessão 3 ---
    {
      guildId,
      adventureId: ADVENTURE_ID,
      actorId: "adv-valerius",
      sessionId: "bGrLeGpKyU75EHQN5Wog",
      occurredAt: SESSION_3_AT,
      sequence: 3,
      title: "Punho de Ferro",
      visibility: "player",
      type: "title_badge",
      granted: true,
    },
    {
      guildId,
      adventureId: ADVENTURE_ID,
      actorId: "adv-kael",
      sessionId: "bGrLeGpKyU75EHQN5Wog",
      occurredAt: SESSION_3_AT,
      sequence: 3,
      title: "Livro Raro",
      visibility: "player",
      type: "title_badge",
      granted: true,
    },
  ];

  console.log(`Gravando ${events.length} eventos em ${ADVENTURE_ID}...`);
  for (const input of events) {
    await repos.adventurerEvents.appendEvent(guildId, ADVENTURE_ID, input);
  }

  const adventurerIds = [
    "adv-valerius",
    "adv-gutsen",
    "adv-nyxx",
    "adv-zephyron",
    "adv-kael",
  ];

  console.log("Recomputando snapshots...");
  for (const id of adventurerIds) {
    const snap = await rebuildSnapshot(repos, guildId, ADVENTURE_ID, id);
    console.log(
      `  ${id}: nível ${snap.snapshot?.totalLevel}, status ${snap.snapshot?.status}, state ${snap.snapshot?.state}`,
    );
  }

  console.log("\n✅ Migração concluída.");
}

main().catch((err) => {
  console.error("❌ Falha na migração:", err);
  process.exit(1);
});
