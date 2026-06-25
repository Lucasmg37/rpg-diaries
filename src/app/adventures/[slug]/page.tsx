import Link from "next/link";
import { notFound } from "next/navigation";

import { NpcCard } from "@/components/public/NpcCard";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Ornament } from "@/components/ui/Ornament";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Stat } from "@/components/ui/Stat";
import { getPublicMasterGuild, getPublicNpcRoster } from "@/lib/guild-data";
import { isAdventurerDead } from "@/lib/adventurer-view";

export const dynamic = "force-static";

export async function generateStaticParams() {
  const { adventures } = await getPublicMasterGuild();
  return adventures.map(({ adventure }) => ({ slug: adventure.slug }));
}

export default async function AdventurePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { adventures } = await getPublicMasterGuild();
  const full = adventures.find((a) => a.adventure.slug === slug);
  if (!full) notFound();

  const { adventure, sessions, adventurers, looseEnds } = full;
  const activeCount = adventurers.filter((a) => !isAdventurerDead(a)).length;
  const fallenCount = adventurers.length - activeCount;
  const openLooseEnds = looseEnds.filter((l) => !l.resolved).length;
  const npcs = await getPublicNpcRoster(adventure.id);

  return (
    <div className="space-y-12">
      <p>
        <Link
          href="/"
          className="text-sm text-guild-muted transition-colors hover:text-guild-goldsoft"
        >
          ← Voltar ao índice
        </Link>
      </p>

      <section className="panel p-8 text-center">
        <Eyebrow>Crônica da Guilda</Eyebrow>
        <h1 className="mt-1 text-2xl font-bold text-guild-gold">
          {adventure.name}
        </h1>
        <Ornament symbol="📜" className="my-4" />
        <p className="mx-auto max-w-2xl leading-relaxed text-guild-muted">
          {adventure.description}
        </p>
      </section>

      {/* Acesso a aventureiros e fios soltos, em links separados */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href={`/adventures/${adventure.slug}/adventurers`}
          className="panel flex items-center justify-between gap-3 p-5 transition-colors hover:border-guild-goldsoft"
        >
          <span>
            <span className="block font-heading text-sm font-semibold text-guild-gold">
              👥 Aventureiros
            </span>
            <span className="mt-1 block text-xs text-guild-muted">
              {adventurers.length} aventureiros · {activeCount} ativos
            </span>
          </span>
          <span className="shrink-0 font-heading text-[11px] uppercase tracking-wide text-guild-goldsoft">
            Abrir →
          </span>
        </Link>

        <Link
          href={`/adventures/${adventure.slug}/loose-ends`}
          className="panel flex items-center justify-between gap-3 p-5 transition-colors hover:border-guild-goldsoft"
        >
          <span>
            <span className="block font-heading text-sm font-semibold text-guild-gold">
              🧵 Fios Soltos
            </span>
            <span className="mt-1 block text-xs text-guild-muted">
              {looseEnds.length} fios · {openLooseEnds} em aberto
            </span>
          </span>
          <span className="shrink-0 font-heading text-[11px] uppercase tracking-wide text-guild-goldsoft">
            Abrir →
          </span>
        </Link>
      </section>

      {/* Estatísticas do grupo */}
      <div className="panel grid grid-cols-2 gap-4 bg-guild-border/10 p-5 sm:grid-cols-4">
        <Stat value={adventurers.length} label="Membros totais" />
        <Stat value={activeCount} label="Ativos agora" />
        <Stat value={fallenCount} label="Caídos" accent />
        <Stat value={sessions.length} label="Sessões registradas" />
      </div>

      {/* NPCs e Bosses já apresentados */}
      {npcs.length > 0 ? (
        <section className="space-y-5">
          <SectionHeading
            eyebrow="Quem cruzou seu caminho"
            title="NPCs & Bosses"
          />
          <div className="grid gap-5 sm:grid-cols-2">
            {npcs.map((npc) => (
              <NpcCard key={npc.id} npc={npc} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Sessões */}
      <section className="space-y-4">
        <SectionHeading title="Sessões" />
        <ul className="space-y-3">
          {sessions.map((session) => (
            <li key={session.id}>
              <Link
                href={`/sessions/${session.id}`}
                className="panel flex items-center gap-3 p-4 transition-colors hover:border-guild-goldsoft"
              >
                <span className="text-2xl" aria-hidden>
                  {session.icon}
                </span>
                <span className="flex-1">
                  <span className="block font-heading font-semibold text-guild-gold">
                    Sessão {session.number} — {session.title}
                  </span>
                  <span className="mt-1 block text-sm text-guild-muted">
                    {session.summary}
                  </span>
                </span>
                <span className="shrink-0 font-heading text-[11px] uppercase tracking-wide text-guild-goldsoft">
                  ler →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
