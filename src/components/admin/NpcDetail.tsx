"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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
import type { Npc } from "@/core/entities/npc";
import type { NpcEvent } from "@/core/entities/npc-event";
import type { FullGuild } from "@/core/entities/views";
import { getAdminGuild, getNpcTimeline } from "@/lib/admin-client";
import {
  formatNpcDamage,
  formatNpcSavingThrow,
  formatNpcSkill,
  isNpcDead,
  npcKindLabel,
  npcStatusLabel,
} from "@/lib/npc-view";
import { NpcEventForm } from "./NpcEventForm";
import { NpcTimeline } from "./NpcTimeline";

export function NpcDetail({
  npcId,
  adventureId,
}: {
  npcId: string;
  adventureId: string;
}) {
  const [guild, setGuild] = useState<FullGuild | null>(null);
  const [npc, setNpc] = useState<Npc | null>(null);
  const [timeline, setTimeline] = useState<NpcEvent[]>([]);
  const [retconTarget, setRetconTarget] = useState<NpcEvent | null>(null);
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    return getAdminGuild()
      .then(setGuild)
      .catch((e) => setError((e as Error).message));
  }, []);

  const loadNpc = useCallback(() => {
    return getNpcTimeline(adventureId, npcId)
      .then((r) => {
        setNpc(r.npc);
        setTimeline(r.timeline);
      })
      .catch((e) => setError((e as Error).message));
  }, [adventureId, npcId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadNpc();
  }, [loadNpc]);

  if (error && !npc) return <Alert tone="error">{error}</Alert>;
  if (!npc || !guild)
    return <p className="py-12 text-center text-sm text-guild-muted">Carregando…</p>;

  const fullAdventure = guild.adventures.find(
    (a) => a.adventure.id === adventureId,
  );
  const adventurers = fullAdventure?.adventurers ?? [];
  const sessions = fullAdventure?.sessions ?? [];
  const isDead = isNpcDead(npc);
  const stats = npc.stats;

  return (
    <div className="space-y-8">
      <p>
        <Link
          href="/admin/management/npcs"
          className="text-sm text-guild-muted transition-colors hover:text-guild-goldsoft"
        >
          ← Voltar a NPCs & Bosses
        </Link>
      </p>

      <Panel className="space-y-3 p-6">
        <div className="flex items-center gap-4">
          <span className="text-4xl" aria-hidden>
            {npc.icon ?? (npc.kind === "boss" ? "👹" : "🧙")}
          </span>
          <div className="flex-1">
            <h1 className="font-heading text-xl font-bold text-guild-gold">
              {npc.name}
            </h1>
            <p className="text-xs uppercase tracking-wide text-guild-muted">
              {npcKindLabel(npc)}
              {npc.role ? ` · ${npc.role}` : ""}
            </p>
          </div>
          <Pill color={isDead ? colors.red : colors.green}>
            {npcStatusLabel(npc)}
          </Pill>
        </div>

        <p className="border-t border-guild-border pt-3 text-sm leading-relaxed text-guild-muted">
          {npc.description}
        </p>

        {npc.masterNotes ? (
          <div className="space-y-1 border-t border-guild-border pt-3">
            <Eyebrow>Notas do mestre (sigiloso)</Eyebrow>
            <p className="text-sm leading-relaxed text-guild-red/90">
              {npc.masterNotes}
            </p>
          </div>
        ) : null}

        {npc.snapshot ? (
          <div className="flex flex-wrap gap-2 border-t border-guild-border pt-3">
            {npc.snapshot.inventory.map((item) => (
              <Pill key={item.id} color={colors.purple} icon="🎒">
                {item.name}
              </Pill>
            ))}
            <Pill color={colors.muted} icon="👁️">
              Visto por {npc.snapshot.seenByAdventurerIds.length} aventureiro(s)
            </Pill>
          </div>
        ) : null}

        {npc.sheetUrl ? (
          <p className="border-t border-guild-border pt-3 text-sm">
            <a
              href={npc.sheetUrl}
              target="_blank"
              rel="noreferrer"
              className="text-guild-goldsoft transition-colors hover:text-guild-gold"
            >
              📄 Ver ficha completa
            </a>
          </p>
        ) : null}
      </Panel>

      {stats ? (
        <Panel className="space-y-3 p-6">
          <Eyebrow>Modo combate — ficha resumida</Eyebrow>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Classe/Tipo" value={stats.classOrType || "—"} />
            {stats.level !== undefined ? <Stat label="Nível" value={String(stats.level)} /> : null}
            <Stat label="PV" value={String(stats.pv)} />
            {stats.pm !== undefined ? <Stat label="PM" value={String(stats.pm)} /> : null}
            <Stat label="Defesa" value={String(stats.defesa)} />
          </div>
          {stats.atributos ? (
            <div className="space-y-1">
              <Eyebrow>Atributos</Eyebrow>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {(
                  [
                    ["for", "For"],
                    ["des", "Des"],
                    ["con", "Con"],
                    ["int", "Int"],
                    ["sab", "Sab"],
                    ["car", "Car"],
                  ] as const
                ).map(([key, label]) => (
                  <Stat key={key} label={label} value={String(stats.atributos![key])} />
                ))}
              </div>
            </div>
          ) : null}
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
        </Panel>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeading eyebrow="Crônica" title="Linha do tempo" />
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
        <NpcTimeline
          events={timeline}
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
        <NpcEventForm
          key={retconTarget?.id ?? "create"}
          npc={npc}
          adventureId={adventureId}
          adventurers={adventurers}
          sessions={sessions}
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
            loadNpc();
          }}
        />
      </Modal>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-guild-border bg-guild-border/10 p-2 text-center">
      <p className="font-heading text-lg font-bold text-guild-gold">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-guild-muted">{label}</p>
    </div>
  );
}
