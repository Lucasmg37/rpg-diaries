/**
 * Demo da Fase 1 — roda 100% em memória, sem Firestore e sem UI.
 *
 * Monta a guild de exemplo com o adapter in-memory e imprime, para cada sessão,
 * a lista de participantes já com nome/classe (do Adventurer fixo) + o badge
 * contextual daquela sessão específica.
 *
 * Critério de saída: confirmar que Nyxx aparece com badge diferente na Sessão 1
 * ("⚠ Suspeito") e na Sessão 2 ("Apreensivo"), e Zephyron "↑ Nv. 2" -> "✝ Caído".
 *
 * Rodar: npm run demo:phase1
 */
import { createInMemoryRepositories } from "@/adapters/in-memory/in-memory.repository";
import { getFullGuild } from "@/core/usecases/get-full-guild";
import { GUILD_ID, buildSampleStore } from "@/lib/sample-data";

async function main() {
  const store = buildSampleStore();
  const repos = createInMemoryRepositories(store);

  const guild = await getFullGuild(repos, GUILD_ID);
  if (!guild) throw new Error("Guild de exemplo não encontrada.");

  console.log("============================================================");
  console.log(`🏰  ${guild.guild.name}`);
  console.log(`    ${guild.guild.description}`);
  console.log("============================================================\n");

  for (const fullAdv of guild.adventures) {
    console.log(`📜  Aventura: ${fullAdv.adventure.name}`);
    console.log(`    Elenco fixo: ${fullAdv.adventurers.length} aventureiros · Fios soltos: ${fullAdv.looseEnds.length}\n`);

    for (const session of fullAdv.sessions) {
      console.log(`  ${session.icon}  Sessão ${session.number} — ${session.title}`);
      console.log("     Participantes (Adventurer fixo + badge contextual da sessão):");
      for (const p of session.participants) {
        const note = p.sessionNote ? `  — ${p.sessionNote}` : "";
        console.log(
          `       ${p.adventurer.icon} ${p.adventurer.name} · ${p.adventurer.className}  →  [${p.sessionBadge}]${note}`,
        );
      }
      console.log(
        `     Fios soltos referenciados: ${session.looseEnds.map((l) => `${l.icon} ${l.title}${l.resolved ? " (resolvido)" : ""}`).join(", ")}`,
      );
      // Confirma que masterNotes NÃO vaza por padrão (payload público):
      console.log(
        `     masterNotes presente no payload público? ${session.masterNotes === undefined ? "não ✅" : "SIM ⚠️"}\n`,
      );
    }
  }

  // Verificação explícita do critério de saída: badge contextual por sessão.
  console.log("------------------------------------------------------------");
  console.log("Verificação do critério de saída (badge contextual por sessão):");
  const sessions = guild.adventures[0]?.sessions ?? [];
  const s1 = sessions.find((s) => s.number === 1);
  const s2 = sessions.find((s) => s.number === 2);
  const badge = (s: typeof s1, advId: string) =>
    s?.participants.find((p) => p.adventurer.id === advId)?.sessionBadge ?? "—";

  const checks: Array<[string, string, string, string]> = [
    ["Nyxx", "adv-nyxx", "⚠ Suspeito", "Apreensivo"],
    ["Zephyron", "adv-zephyron", "↑ Nv. 2", "✝ Caído"],
  ];
  let allOk = true;
  for (const [name, id, expected1, expected2] of checks) {
    const got1 = badge(s1, id);
    const got2 = badge(s2, id);
    const ok = got1 === expected1 && got2 === expected2;
    allOk &&= ok;
    console.log(
      `  ${ok ? "✅" : "❌"} ${name}: Sessão 1 = "${got1}" | Sessão 2 = "${got2}"`,
    );
  }
  console.log("------------------------------------------------------------");
  if (!allOk) {
    console.error("\n❌ Critério de saída NÃO atendido.");
    process.exit(1);
  }
  console.log("\n✅ Critério de saída da Fase 1 atendido.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
