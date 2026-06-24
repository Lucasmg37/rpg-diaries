import Link from "next/link";
import { notFound } from "next/navigation";

import { NpcTimeline } from "@/components/public/NpcTimeline";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Pill } from "@/components/ui/Pill";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { colors } from "@/components/ui/tokens";
import { getPublicMasterGuild, getPublicNpcRoster, getPublicNpcTimeline } from "@/lib/guild-data";
import { isNpcDead, npcKindLabel, npcStatusLabel } from "@/lib/npc-view";

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
  const isDead = isNpcDead(npc);

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
        <Eyebrow>{npcKindLabel(npc)} da Crônica</Eyebrow>
        <div className="flex flex-col items-center gap-2">
          <span className="text-4xl" aria-hidden>
            {npc.icon ?? (npc.kind === "boss" ? "👹" : "🧙")}
          </span>
          <h1 className="font-heading text-2xl font-bold text-guild-gold">
            {npc.name}
          </h1>
          {npc.role ? (
            <p className="text-xs uppercase tracking-wide text-guild-muted">
              {npc.role}
            </p>
          ) : null}
          <Pill color={isDead ? colors.red : colors.green}>
            {npcStatusLabel(npc)}
          </Pill>
        </div>

        <p className="mx-auto max-w-2xl border-t border-guild-border pt-4 leading-relaxed text-guild-muted">
          {npc.description}
        </p>
      </section>

      <section className="space-y-4">
        <SectionHeading eyebrow="Crônica" title="Linha do tempo" />
        <NpcTimeline events={timeline} />
      </section>
    </div>
  );
}
