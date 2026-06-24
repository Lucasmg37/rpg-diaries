import Link from "next/link";
import { notFound } from "next/navigation";

import { AdventurerTimeline } from "@/components/public/AdventurerTimeline";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Pill } from "@/components/ui/Pill";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { colors } from "@/components/ui/tokens";
import {
  adventurerClassLabel,
  adventurerLevel,
  adventurerSheetUrl,
  adventurerStatusLabel,
  isAdventurerDead,
} from "@/lib/adventurer-view";
import { getPublicAdventurerTimeline, getPublicMasterGuild } from "@/lib/guild-data";

export const dynamic = "force-static";

export async function generateStaticParams() {
  const { adventures } = await getPublicMasterGuild();
  return adventures.flatMap(({ adventurers }) =>
    adventurers.map((a) => ({ id: a.id })),
  );
}

export default async function AdventurerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { adventures } = await getPublicMasterGuild();

  const owner = adventures.find((a) =>
    a.adventurers.some((adv) => adv.id === id),
  );
  const adventurer = owner?.adventurers.find((adv) => adv.id === id);
  if (!owner || !adventurer) notFound();

  const { timeline } = await getPublicAdventurerTimeline(
    owner.adventure.id,
    id,
  );
  const namesById = new Map(owner.adventurers.map((a) => [a.id, a.name]));

  const isDead = isAdventurerDead(adventurer);
  const sheetUrl = adventurerSheetUrl(adventurer);

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

      <section className="panel space-y-3 p-8 text-center">
        <Eyebrow>Crônica da Guilda</Eyebrow>
        <div className="flex flex-col items-center gap-2">
          <span className="text-4xl" aria-hidden>
            {adventurer.icon}
          </span>
          <h1 className="font-heading text-2xl font-bold text-guild-gold">
            {adventurer.name}
          </h1>
          <p className="text-xs uppercase tracking-wide text-guild-muted">
            {adventurerClassLabel(adventurer)} · Nv. {adventurerLevel(adventurer)}
          </p>
          <Pill color={isDead ? colors.red : colors.green}>
            {adventurerStatusLabel(adventurer)}
          </Pill>
        </div>

        <p className="mx-auto max-w-2xl border-t border-guild-border pt-4 leading-relaxed text-guild-muted">
          {adventurer.background}
        </p>

        {adventurer.goal ? (
          <p className="mx-auto max-w-2xl text-sm italic text-guild-goldsoft">
            🎯 {adventurer.goal}
          </p>
        ) : null}

        {adventurer.snapshot ? (
          <div className="flex flex-wrap justify-center gap-2 border-t border-guild-border pt-4">
            {adventurer.snapshot.titles.map((t) => (
              <Pill key={t} color={colors.goldsoft} icon="🏅">
                {t}
              </Pill>
            ))}
            {adventurer.snapshot.inventory.map((item) => (
              <Pill key={item.id} color={colors.purple} icon="🎒">
                {item.name}
              </Pill>
            ))}
          </div>
        ) : null}

        {sheetUrl ? (
          <a
            href={sheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block font-heading text-[11px] uppercase tracking-wide text-guild-goldsoft transition-colors hover:text-guild-gold"
          >
            Ver ficha completa →
          </a>
        ) : null}
      </section>

      <section className="space-y-4">
        <SectionHeading eyebrow="Crônica pessoal" title="Linha do tempo" />
        <AdventurerTimeline events={timeline} adventurerNamesById={namesById} />
      </section>
    </div>
  );
}
