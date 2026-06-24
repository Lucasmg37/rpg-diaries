import { Timestamp } from "firebase-admin/firestore";
import type {
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";

import type { Adventure } from "@/core/entities/adventure";
import type { Adventurer } from "@/core/entities/adventurer";
import type { Guild } from "@/core/entities/guild";
import type { LooseEnd } from "@/core/entities/loose-end";
import type { Npc } from "@/core/entities/npc";
import type { Session } from "@/core/entities/session";
import type { StoryNote, StoryPlan } from "@/core/entities/story-plan";

/** Converte Timestamp do Firestore (ou string/Date) em Date. */
function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    return new Date(value);
  }
  return new Date(0);
}

type Snap = QueryDocumentSnapshot<DocumentData>;

export function mapGuild(snap: Snap): Guild {
  const d = snap.data();
  return {
    id: snap.id,
    name: d.name,
    slug: d.slug,
    description: d.description,
    masterId: d.masterId,
    createdAt: toDate(d.createdAt),
  };
}

export function mapAdventure(snap: Snap): Adventure {
  const d = snap.data();
  return {
    id: snap.id,
    guildId: d.guildId,
    name: d.name,
    slug: d.slug,
    description: d.description,
    order: d.order,
    createdAt: toDate(d.createdAt),
  };
}

export function mapSession(snap: Snap): Session {
  const d = snap.data();
  return {
    id: snap.id,
    guildId: d.guildId,
    adventureId: d.adventureId,
    title: d.title,
    number: d.number,
    icon: d.icon,
    summary: d.summary,
    timeline: d.timeline ?? [],
    tags: d.tags ?? [],
    masterNotes: d.masterNotes ?? "",
    participants: d.participants ?? [],
    looseEndIds: d.looseEndIds ?? [],
    npcIds: d.npcIds ?? undefined,
    closing: d.closing ?? undefined,
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  };
}

export function mapAdventurer(snap: Snap): Adventurer {
  const d = snap.data();
  return {
    id: snap.id,
    guildId: d.guildId,
    adventureId: d.adventureId,
    name: d.name,
    className: d.className,
    icon: d.icon,
    background: d.background,
    goal: d.goal,
    sheetUrl: d.sheetUrl,
    snapshot: d.snapshot,
  };
}

export function mapNpc(snap: Snap): Npc {
  const d = snap.data();
  return {
    id: snap.id,
    guildId: d.guildId,
    adventureId: d.adventureId,
    arcId: d.arcId ?? undefined,
    kind: d.kind,
    name: d.name,
    icon: d.icon ?? undefined,
    role: d.role ?? undefined,
    description: d.description ?? "",
    masterNotes: d.masterNotes ?? undefined,
    stats: d.stats ?? undefined,
    sheetUrl: d.sheetUrl ?? undefined,
    snapshot: d.snapshot ?? undefined,
  };
}

export function mapLooseEnd(snap: Snap): LooseEnd {
  const d = snap.data();
  return {
    id: snap.id,
    guildId: d.guildId,
    adventureId: d.adventureId,
    title: d.title,
    category: d.category,
    description: d.description,
    color: d.color,
    icon: d.icon,
    resolved: d.resolved,
  };
}

export function mapStoryPlan(snap: Snap): StoryPlan {
  const d = snap.data();
  const liveNotes: StoryNote[] = (d.liveNotes ?? []).map(
    (n: Record<string, unknown>) => ({
      id: String(n.id),
      body: String(n.body),
      sceneId: n.sceneId ? String(n.sceneId) : undefined,
      createdAt: toDate(n.createdAt),
    }),
  );
  return {
    id: snap.id,
    guildId: d.guildId,
    adventureId: d.adventureId,
    title: d.title,
    eyebrow: d.eyebrow ?? "",
    subtitle: d.subtitle ?? "",
    loreBanner: d.loreBanner ?? undefined,
    scenes: d.scenes ?? [],
    reward: d.reward ?? undefined,
    liveNotes,
    order: d.order ?? 0,
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  };
}
