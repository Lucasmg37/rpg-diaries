import Link from "next/link";
import { notFound } from "next/navigation";

import { NpcTimeline } from "@/components/public/NpcTimeline";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Pill } from "@/components/ui/Pill";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { colors } from "@/components/ui/tokens";
import { getPublicMasterGuild, getPublicNpcRoster, getPublicNpcTimeline } from "@/lib/guild-data";
import {
  formatNpcDamage,
  formatNpcSavingThrow,
  formatNpcSkill,
  isNpcDead,
  npcKindLabel,
  npcStatusLabel,
} from "@/lib/npc-view";

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
  const stats = npc.stats;

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

      {stats ? (
        <section className="panel space-y-3 p-6">
          <Eyebrow>Ficha de combate</Eyebrow>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <PublicStat label="Classe/Tipo" value={stats.classOrType || "—"} />
            <PublicStat label="PV" value={String(stats.pv)} />
            {stats.pm !== undefined ? (
              <PublicStat label="PM" value={String(stats.pm)} />
            ) : null}
            <PublicStat label="Defesa" value={String(stats.defesa)} />
          </div>
          {stats.resistencias?.length ? (
            <div className="space-y-1">
              <Eyebrow>Resistências</Eyebrow>
              <div className="flex flex-wrap gap-2">
                {stats.resistencias.map((r) => (
                  <Pill key={r} color={colors.goldsoft}>{r}</Pill>
                ))}
              </div>
            </div>
          ) : null}
          {stats.imunidades?.length ? (
            <div className="space-y-1">
              <Eyebrow>Imunidades</Eyebrow>
              <div className="flex flex-wrap gap-2">
                {stats.imunidades.map((r) => (
                  <Pill key={r} color={colors.purple}>{r}</Pill>
                ))}
              </div>
            </div>
          ) : null}
          {stats.pericias?.length ? (
            <div className="space-y-1">
              <Eyebrow>Perícias</Eyebrow>
              <div className="flex flex-wrap gap-2">
                {stats.pericias.map((p) => (
                  <Pill key={p.nome} color={colors.green}>{formatNpcSkill(p)}</Pill>
                ))}
              </div>
            </div>
          ) : null}
          {stats.habilidades?.length ? (
            <div className="space-y-1">
              <Eyebrow>Habilidades</Eyebrow>
              <div className="space-y-1 text-sm text-guild-muted">
                {stats.habilidades.map((h) => (
                  <p key={h.nome}>
                    <strong className="text-guild-gold">{h.nome}</strong>
                    {h.efeito ? ` — ${h.efeito}` : ""}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
          {stats.ataques?.length ? (
            <div className="space-y-1 border-t border-guild-border pt-3 text-sm text-guild-muted">
              <Eyebrow>Ataques</Eyebrow>
              {stats.ataques.map((a) => (
                <p key={a.name}>
                  <strong className="text-guild-gold">{a.name}</strong>
                  {a.bonus ? ` ${a.bonus}` : ""}
                  {a.damage?.length ? ` — ${formatNpcDamage(a.damage)}` : ""}
                  {a.critico ? ` (crítico ${a.critico})` : ""}
                </p>
              ))}
            </div>
          ) : null}
          {stats.magias?.length ? (
            <div className="space-y-1 border-t border-guild-border pt-3 text-sm text-guild-muted">
              <Eyebrow>Magias</Eyebrow>
              {stats.magias.map((m) => {
                const savingThrow = formatNpcSavingThrow(m.resistencia);
                return (
                  <p key={m.nome}>
                    <strong className="text-guild-gold">{m.nome}</strong>
                    {m.tipo ? ` (${m.tipo})` : ""}
                    {m.area ? ` — Área: ${m.area}` : ""}
                    {savingThrow ? ` — Resistência: ${savingThrow}` : ""}
                    {m.resistencia?.sucesso ? ` — Sucesso: ${m.resistencia.sucesso}` : ""}
                    {m.resistencia?.falha ? ` — Falha: ${m.resistencia.falha}` : ""}
                    {m.efeito ? ` — ${m.efeito}` : ""}
                  </p>
                );
              })}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-4">
        <SectionHeading eyebrow="Crônica" title="Linha do tempo" />
        <NpcTimeline events={timeline} />
      </section>
    </div>
  );
}

function PublicStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-guild-border bg-guild-border/10 p-2 text-center">
      <p className="font-heading text-lg font-bold text-guild-gold">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-guild-muted">{label}</p>
    </div>
  );
}
