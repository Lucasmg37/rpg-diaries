"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Alert,
  Button,
  Eyebrow,
  Modal,
  Panel,
  Pill,
  SectionHeading,
} from "@/components/ui";
import { colors } from "@/components/ui/tokens";
import type { AdventurerEvent } from "@/core/entities/adventurer-event";
import type { FullGuild } from "@/core/entities/views";
import {
  adventurerClassLabel,
  adventurerLevel,
  adventurerStatusLabel,
  isAdventurerDead,
} from "@/lib/adventurer-view";
import { getAdminGuild, getAdventurerTimeline } from "@/lib/admin-client";
import { AdventurerEventForm } from "./AdventurerEventForm";
import { AdventurerTimeline } from "./AdventurerTimeline";

export function AdventurerDetail({ adventurerId }: { adventurerId: string }) {
  const [guild, setGuild] = useState<FullGuild | null>(null);
  const [timeline, setTimeline] = useState<AdventurerEvent[]>([]);
  const [retconTarget, setRetconTarget] = useState<AdventurerEvent | null>(null);
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [error, setError] = useState("");

  const owner = useMemo(() => {
    if (!guild) return undefined;
    for (const a of guild.adventures) {
      const adventurer = a.adventurers.find((adv) => adv.id === adventurerId);
      if (adventurer) return { fullAdventure: a, adventurer, all: a.adventurers };
    }
    return undefined;
  }, [guild, adventurerId]);

  const load = useCallback(() => {
    return getAdminGuild()
      .then(setGuild)
      .catch((e) => setError((e as Error).message));
  }, []);

  const loadTimeline = useCallback((adventureId: string) => {
    return getAdventurerTimeline(adventureId, adventurerId)
      .then((r) => setTimeline(r.timeline))
      .catch((e) => setError((e as Error).message));
  }, [adventurerId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (owner) loadTimeline(owner.fullAdventure.adventure.id);
  }, [owner, loadTimeline]);

  if (error && !guild) return <Alert tone="error">{error}</Alert>;
  if (!guild) return <p className="py-12 text-center text-sm text-guild-muted">Carregando…</p>;
  if (!owner) return <Alert tone="error">Aventureiro não encontrado.</Alert>;

  const { fullAdventure, adventurer, all } = owner;
  const adventure = fullAdventure.adventure;
  const isDead = isAdventurerDead(adventurer);
  const namesById = new Map(all.map((a) => [a.id, a.name]));
  const otherAdventurers = all.filter((a) => a.id !== adventurer.id);

  return (
    <div className="space-y-8">
      <p>
        <Link
          href="/admin/management/adventurers"
          className="text-sm text-guild-muted transition-colors hover:text-guild-goldsoft"
        >
          ← Voltar a Aventureiros
        </Link>
      </p>

      <Panel className="space-y-3 p-6">
        <div className="flex items-center gap-4">
          <span className="text-4xl" aria-hidden>
            {adventurer.icon}
          </span>
          <div className="flex-1">
            <h1 className="font-heading text-xl font-bold text-guild-gold">
              {adventurer.name}
            </h1>
            <p className="text-xs uppercase tracking-wide text-guild-muted">
              {adventurerClassLabel(adventurer)} · Nv. {adventurerLevel(adventurer)} ·{" "}
              {adventure.name}
            </p>
          </div>
          <Pill color={isDead ? colors.red : colors.green}>
            {adventurerStatusLabel(adventurer)}
          </Pill>
        </div>

        <p className="border-t border-guild-border pt-3 text-sm leading-relaxed text-guild-muted">
          {adventurer.background}
        </p>

        {adventurer.goal ? (
          <p className="text-sm italic text-guild-goldsoft">🎯 {adventurer.goal}</p>
        ) : null}

        {adventurer.snapshot ? (
          <div className="flex flex-wrap gap-2 border-t border-guild-border pt-3">
            {adventurer.snapshot.titles.map((t) => (
              <Pill key={t} color={colors.goldsoft} icon="🏅">
                {t}
              </Pill>
            ))}
            {adventurer.snapshot.inventory.map((item) => (
              <Pill key={item.id} color={colors.purple} icon="🎒">
                {item.name}
                {item.quantity && item.quantity > 1 ? ` ×${item.quantity}` : ""}
              </Pill>
            ))}
          </div>
        ) : null}
      </Panel>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeading eyebrow="Crônica pessoal" title="Linha do tempo" />
          <Button
            type="button"
            onClick={() => {
              setRetconTarget(null);
              setEventFormOpen(true);
            }}
          >
            + Adicionar evento
          </Button>
        </div>
        <Eyebrow className="block">Inclui eventos sigilosos (visíveis só ao mestre)</Eyebrow>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <AdventurerTimeline
          events={timeline}
          adventurerNamesById={namesById}
          onRetcon={(event) => {
            setRetconTarget(event);
            setEventFormOpen(true);
          }}
        />
      </section>

      <Modal
        open={eventFormOpen}
        onClose={() => {
          setRetconTarget(null);
          setEventFormOpen(false);
        }}
        title={retconTarget ? `Corrigir: ${retconTarget.title}` : "Adicionar evento"}
        maxWidth="max-w-2xl"
      >
        <AdventurerEventForm
          key={retconTarget?.id ?? "create"}
          adventurer={adventurer}
          adventureId={adventure.id}
          otherAdventurers={otherAdventurers}
          sessions={fullAdventure.sessions}
          retconTargetId={retconTarget?.id}
          initial={
            retconTarget
              ? {
                  type: retconTarget.type,
                  title: retconTarget.title,
                  body: retconTarget.body,
                  visibility: retconTarget.visibility,
                }
              : undefined
          }
          onCancel={() => {
            setRetconTarget(null);
            setEventFormOpen(false);
          }}
          onCreated={() => {
            setRetconTarget(null);
            setEventFormOpen(false);
            loadTimeline(adventure.id);
          }}
        />
      </Modal>
    </div>
  );
}
