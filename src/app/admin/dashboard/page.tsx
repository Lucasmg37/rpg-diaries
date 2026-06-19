"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PublishButton } from "@/components/admin/PublishButton";
import { Alert } from "@/components/ui/Alert";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Ornament } from "@/components/ui/Ornament";
import { Panel } from "@/components/ui/Panel";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Stat } from "@/components/ui/Stat";
import type { StoryPlan } from "@/core/entities/story-plan";
import type { FullGuild } from "@/core/entities/views";
import { getAdminGuild, listStoryPlans } from "@/lib/admin-client";

export default function DashboardPage() {
  const [guild, setGuild] = useState<FullGuild | null>(null);
  const [storyPlans, setStoryPlans] = useState<StoryPlan[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminGuild()
      .then(setGuild)
      .catch((e) => setError((e as Error).message));
  }, []);

  useEffect(() => {
    if (!guild) return;
    Promise.all(guild.adventures.map((a) => listStoryPlans(a.adventure.id)))
      .then((lists) => setStoryPlans(lists.flat()))
      .catch(() => {});
  }, [guild]);

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!guild)
    return (
      <p className="py-12 text-center text-sm text-guild-muted">Carregando…</p>
    );

  const totalSessions = guild.adventures.reduce(
    (n, a) => n + a.sessions.length,
    0,
  );
  const totalAdventurers = guild.adventures.reduce(
    (n, a) => n + a.adventurers.length,
    0,
  );
  const openLooseEnds = guild.adventures.reduce(
    (n, a) => n + a.looseEnds.filter((l) => !l.resolved).length,
    0,
  );

  return (
    <div className="space-y-10">
      <section className="panel p-8 text-center">
        <Eyebrow>Painel do Mestre</Eyebrow>
        <h1 className="mt-1 text-2xl font-bold text-guild-gold">
          {guild.guild.name}
        </h1>
        <Ornament className="my-4" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat value={guild.adventures.length} label="Aventuras" />
          <Stat value={totalSessions} label="Sessões" />
          <Stat value={totalAdventurers} label="Aventureiros" />
          <Stat value={openLooseEnds} label="Fios em aberto" accent />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading title="Gestão" />
        <div className="grid gap-3 sm:grid-cols-3">
          <NavCard href="/admin/management/sessions" icon="📜" label="Sessões" />
          <NavCard
            href="/admin/management/adventurers"
            icon="👥"
            label="Aventureiros"
          />
          <NavCard
            href="/admin/management/loose-ends"
            icon="🧵"
            label="Fios Soltos"
          />
          <NavCard
            href="/admin/management/story-plans"
            icon="📜"
            label="Roteiros"
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading title="Roteiros do Mestre" />
        <div className="space-y-2">
          {storyPlans.map((p) => (
            <div key={p.id} className="panel flex items-center gap-3 p-4">
              <span className="flex-1">
                <span className="block font-heading text-sm font-semibold text-guild-gold">
                  {p.title}
                </span>
                <span className="text-xs text-guild-muted">
                  {p.scenes.length} cena(s) · {p.liveNotes.length} nota(s) ao
                  vivo
                </span>
              </span>
              <Link
                href={`/story-plans/${p.id}?adventureId=${encodeURIComponent(p.adventureId)}`}
                className="text-xs uppercase tracking-wide text-guild-goldsoft transition-colors hover:text-guild-gold"
              >
                Ver
              </Link>
              <Link
                href={`/admin/management/story-plans?edit=${p.id}&adventureId=${encodeURIComponent(p.adventureId)}`}
                className="text-xs uppercase tracking-wide text-guild-goldsoft transition-colors hover:text-guild-gold"
              >
                Editar
              </Link>
            </div>
          ))}
          {storyPlans.length === 0 ? (
            <p className="py-4 text-center text-xs text-guild-muted">
              Nenhum roteiro cadastrado ainda.
            </p>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Publicação"
          title="Publicar alterações"
        />
        <Panel className="space-y-3 p-6 text-center">
          <p className="text-sm text-guild-muted">
            As mudanças só aparecem no diário público após um novo build. Clique
            para disparar o deploy na Vercel.
          </p>
          <div className="flex justify-center">
            <PublishButton />
          </div>
        </Panel>
      </section>
    </div>
  );
}

function NavCard({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="panel flex items-center gap-3 p-5 transition-colors hover:border-guild-goldsoft"
    >
      <span className="text-2xl" aria-hidden>
        {icon}
      </span>
      <span className="font-heading text-sm font-semibold text-guild-gold">
        {label}
      </span>
    </Link>
  );
}
