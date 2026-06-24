/**
 * Verificação da Fase 2 — lê a guild do master através do repository-factory.
 * Com as credenciais do Firebase presentes, o factory escolhe o adapter
 * Firestore, então este script confirma o round-trip contra o banco real.
 *
 * Rodar: npm run verify:firestore
 */
import { getMasterGuildId } from "@/adapters/config/master-config";
import {
  getRepositories,
  isUsingSampleData,
} from "@/adapters/config/repository-factory";
import { getFullGuild } from "@/core/usecases/get-full-guild";

async function main() {
  console.log(
    `Fonte de dados: ${isUsingSampleData() ? "in-memory (exemplo) ⚠️" : "Firestore ✅"}`,
  );
  if (isUsingSampleData()) {
    console.error(
      "❌ Esperava Firestore. Verifique as variáveis FIREBASE_* em .env.local.",
    );
    process.exit(1);
  }

  const repos = getRepositories();
  const guildId = getMasterGuildId();
  const guild = await getFullGuild(repos, guildId);

  if (!guild) {
    console.error(`❌ Guild "${guildId}" não encontrada no Firestore.`);
    process.exit(1);
  }

  console.log(`\n🏰 ${guild.guild.name} (${guild.guild.id})`);
  for (const adv of guild.adventures) {
    console.log(
      `📜 ${adv.adventure.name} — ${adv.sessions.length} sessões, ${adv.adventurers.length} aventureiros, ${adv.looseEnds.length} fios soltos`,
    );
    for (const s of adv.sessions) {
      console.log(`   ${s.icon} Sessão ${s.number} — ${s.title}`);
      for (const p of s.participants) {
        console.log(
          `      ${p.adventurer.icon} ${p.adventurer.name} → [${p.sessionBadge}]`,
        );
      }
      console.log(
        `      masterNotes no payload público? ${s.masterNotes === undefined ? "não ✅" : "SIM ⚠️"}`,
      );
    }
  }

  // Critério: badge contextual por sessão, lido do Firestore.
  // Sessão 1 tem eventos para Nyxx → deriveSessionBadge projeta o texto a
  // partir da timeline. Sessão 2 não tem eventos para ele → cai no
  // sessionBadge legado digitado à mão ("Apreensivo").
  const nyxx1 = guild.adventures[0]?.sessions
    .find((s) => s.number === 1)
    ?.participants.find((p) => p.adventurer.name === "Nyxx")?.sessionBadge;
  const nyxx2 = guild.adventures[0]?.sessions
    .find((s) => s.number === 2)
    ?.participants.find((p) => p.adventurer.name === "Nyxx")?.sessionBadge;
  const ok =
    nyxx1 === "↑ Nv. 2 · Ausentou-se da cerimônia" && nyxx2 === "Apreensivo";
  console.log(
    `\n${ok ? "✅" : "❌"} Nyxx (do Firestore): Sessão 1 = "${nyxx1}" | Sessão 2 = "${nyxx2}"`,
  );
  if (!ok) process.exit(1);
  console.log("\n✅ Critério de saída da Fase 2 atendido (leitura do Firestore real).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
