import Link from "next/link";
import { notFound } from "next/navigation";

import { NpcSheetContent } from "@/components/public/NpcSheetContent";
import { NpcTimeline } from "@/components/public/NpcTimeline";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getPublicMasterGuild, getPublicNpcRoster, getPublicNpcTimeline } from "@/lib/guild-data";

export const dynamic = "force-static";

export async function generateStaticParams() {
  const { adventures } = await getPublicMasterGuild();
  const params: { id: string }[] = [];
  for (const { adventure } of adventures) {
    const npcs = await getPublicNpcRoster(adventure.id);
    params.push(...npcs.map((n) => ({ id: n.id })));
  }
  return params;
}

export default async function NpcPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { adventures } = await getPublicMasterGuild();

  let owner: (typeof adventures)[number] | undefined;
  for (const a of adventures) {
    const roster = await getPublicNpcRoster(a.adventure.id);
    if (roster.some((n) => n.id === id)) {
      owner = a;
      break;
    }
  }
  if (!owner) notFound();

  const { npc, timeline } = await getPublicNpcTimeline(owner.adventure.id, id);

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

      <NpcSheetContent npc={npc} />

      <section className="space-y-4">
        <SectionHeading eyebrow="Crônica" title="Linha do tempo" />
        <NpcTimeline events={timeline} />
      </section>
    </div>
  );
}
