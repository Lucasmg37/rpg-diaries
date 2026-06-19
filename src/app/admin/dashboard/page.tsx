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
import type { FullGuild } from "@/core/entities/views";
import { getAdminGuild } from "@/lib/admin-client";

export default function DashboardPage() {
  const [guild, setGuild] = useState<FullGuild | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminGuild()
      .then(setGuild)
      .catch((e) => setError((e as Error).message));
  }, []);

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
