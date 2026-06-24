import Link from "next/link";
import { notFound } from "next/navigation";

import { LooseEndTag } from "@/components/public/LooseEndTag";
import { NpcCard } from "@/components/public/NpcCard";
import { PartyCard } from "@/components/public/PartyCard";
import { TagBadge } from "@/components/public/TagBadge";
import { TimelineEntryItem } from "@/components/public/TimelineEntryItem";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Quote } from "@/components/ui/Quote";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getPublicMasterGuild, getPublicNpcRoster } from "@/lib/guild-data";

export const dynamic = "force-static";

export async function generateStaticParams() {
  const { adventures } = await getPublicMasterGuild();
  return adventures.flatMap(({ sessions }) =>
    sessions.map((s) => ({ id: s.id })),
  );
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { adventures } = await getPublicMasterGuild();

  const owner = adventures.find((a) => a.sessions.some((s) => s.id === id));
  const session = owner?.sessions.find((s) => s.id === id);
  if (!owner || !session) notFound();

  const sessionNpcs = (await getPublicNpcRoster(owner.adventure.id)).filter(
    (npc) => npc.snapshot?.appearedInSessionIds.includes(session.id),
  );

  return (
    <div className="space-y-10">
      <p>
        <Link
          href={`/adventures/${owner.adventure.slug}`}
          className="text-sm text-guild-muted transition-colors hover:text-guild-goldsoft"
        >
          ← {owner.adventure.name}
        </Link>
      </p>

      {/* Cabeçalho da sessão */}
      <section className="panel p-8 text-center">
        <Eyebrow>Crônica da Guilda · Sessão {session.number}</Eyebrow>
        <h1 className="mt-2 flex items-center justify-center gap-3 text-2xl font-bold text-guild-gold sm:text-3xl">
          <span aria-hidden>{session.icon}</span>
          {session.title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-guild-muted">
          {session.summary}
        </p>
        {session.tags.length > 0 ? (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {session.tags.map((tag) => (
              <TagBadge key={tag.label} tag={tag} />
            ))}
          </div>
        ) : null}
      </section>

      {/* O grupo nesta sessão */}
      {session.participants.length > 0 ? (
        <section className="space-y-4">
          <SectionHeading title="O Grupo nesta sessão" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {session.participants.map((participant) => (
              <PartyCard
                key={participant.adventurer.id}
                participant={participant}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Linha do tempo */}
      {session.timeline.length > 0 ? (
        <section className="space-y-4">
          <SectionHeading title="Crônica" />
          <div className="panel p-6">
            <ol className="list-none">
              {session.timeline.map((entry, i) => (
                <TimelineEntryItem
                  key={`${entry.title}-${i}`}
                  entry={entry}
                  isLast={i === session.timeline.length - 1}
                />
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* NPCs e Bosses presentes */}
      {sessionNpcs.length > 0 ? (
        <section className="space-y-4">
          <SectionHeading title="NPCs & Bosses" />
          <div className="grid gap-4 sm:grid-cols-2">
            {sessionNpcs.map((npc) => (
              <NpcCard key={npc.id} npc={npc} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Fios soltos desta sessão */}
      {session.looseEnds.length > 0 ? (
        <section className="space-y-4">
          <SectionHeading title="Fios Soltos" />
          <div className="flex flex-wrap justify-center gap-2">
            {session.looseEnds.map((looseEnd) => (
              <LooseEndTag key={looseEnd.id} looseEnd={looseEnd} />
            ))}
          </div>
          <p className="text-center text-sm text-guild-muted">
            Veja os detalhes em{" "}
            <Link
              href={`/adventures/${owner.adventure.slug}`}
              className="text-guild-goldsoft underline-offset-2 hover:underline"
            >
              Fios Soltos da Campanha
            </Link>
            .
          </p>
        </section>
      ) : null}

      {/* Nota de encerramento */}
      {session.closing ? (
        <section className="border-t border-guild-border pt-8">
          <Quote
            quote={session.closing.quote}
            tagline={session.closing.tagline}
          />
        </section>
      ) : null}
    </div>
  );
}
