import Link from "next/link";
import { notFound } from "next/navigation";

import { AdventurerCard } from "@/components/public/AdventurerCard";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Ornament } from "@/components/ui/Ornament";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Stat } from "@/components/ui/Stat";
import { getPublicMasterGuild } from "@/lib/guild-data";
import { isAdventurerDead } from "@/lib/adventurer-view";

export const dynamic = "force-static";

export async function generateStaticParams() {
  const { adventures } = await getPublicMasterGuild();
  return adventures.map(({ adventure }) => ({ slug: adventure.slug }));
}

export default async function AdventureAdventurersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { adventures } = await getPublicMasterGuild();
  const full = adventures.find((a) => a.adventure.slug === slug);
  if (!full) notFound();

  const { adventure, adventurers } = full;
  const activeCount = adventurers.filter((a) => !isAdventurerDead(a)).length;
  const fallenCount = adventurers.length - activeCount;

  return (
    <div className="space-y-10">
      <p>
        <Link
          href={`/adventures/${adventure.slug}`}
          className="text-sm text-guild-muted transition-colors hover:text-guild-goldsoft"
        >
          ← {adventure.name}
        </Link>
      </p>

      <section className="panel p-8 text-center">
        <Eyebrow>Membros da Guilda</Eyebrow>
        <h1 className="mt-1 text-2xl font-bold text-guild-gold">
          Aventureiros
        </h1>
        <Ornament className="my-4" />
        <p className="mx-auto max-w-2xl leading-relaxed text-guild-muted">
          {adventure.name}
        </p>
      </section>

      <section className="space-y-5">
        <SectionHeading title="Perfil dos Aventureiros" />

        <div className="grid gap-5 sm:grid-cols-2">
          {adventurers.map((adventurer) => (
            <AdventurerCard key={adventurer.id} adventurer={adventurer} />
          ))}
        </div>

        <div className="panel grid grid-cols-3 gap-4 bg-guild-border/10 p-5">
          <Stat value={adventurers.length} label="Membros totais" />
          <Stat value={activeCount} label="Ativos agora" />
          <Stat value={fallenCount} label="Caídos" accent />
        </div>
      </section>
    </div>
  );
}
