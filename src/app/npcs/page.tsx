import Link from "next/link";

import { NpcCard } from "@/components/public/NpcCard";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Ornament } from "@/components/ui/Ornament";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getPublicMasterGuild, getPublicNpcRoster } from "@/lib/guild-data";

export const dynamic = "force-static";

export default async function NpcsPage() {
  const { adventures } = await getPublicMasterGuild();

  const groups = await Promise.all(
    adventures.map(async (full) => ({
      adventure: full.adventure,
      npcs: await getPublicNpcRoster(full.adventure.id),
    })),
  );

  const totalNpcs = groups.reduce((n, g) => n + g.npcs.length, 0);

  return (
    <div className="space-y-10">
      <p>
        <Link
          href="/"
          className="text-sm text-guild-muted transition-colors hover:text-guild-goldsoft"
        >
          ← Voltar ao índice
        </Link>
      </p>

      <section className="panel p-8 text-center">
        <Eyebrow>Quem cruzou seu caminho</Eyebrow>
        <h1 className="mt-1 text-2xl font-bold text-guild-gold">
          NPCs & Bosses
        </h1>
        <Ornament symbol="👹" className="my-4" />
        <p className="mx-auto max-w-2xl leading-relaxed text-guild-muted">
          Toda figura já apresentada na crônica da guilda, aliada ou inimiga.
        </p>
      </section>

      {groups.map(({ adventure, npcs }) =>
        npcs.length > 0 ? (
          <section key={adventure.id} className="space-y-5">
            <SectionHeading eyebrow={adventure.name} title="Elenco" />
            <div className="grid gap-5 sm:grid-cols-2">
              {npcs.map((npc) => (
                <NpcCard key={npc.id} npc={npc} />
              ))}
            </div>
          </section>
        ) : null,
      )}

      {totalNpcs === 0 ? (
        <p className="py-12 text-center text-sm text-guild-muted">
          Nenhum NPC ou boss apresentado ainda.
        </p>
      ) : null}
    </div>
  );
}
