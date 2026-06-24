import type { Npc, NpcKind } from "@/core/entities/npc";
import type { NpcStatus } from "@/core/entities/npc-event";

const STATUS_LABELS: Record<NpcStatus, string> = {
  alive: "Vivo",
  dead: "Morto",
  revived: "Revivido",
  missing: "Desaparecido",
  unknown: "Desconhecido",
};

const KIND_LABELS: Record<NpcKind, string> = {
  npc: "NPC",
  boss: "Boss",
};

export function npcStatus(npc: Npc): NpcStatus {
  return npc.snapshot?.status ?? "unknown";
}

export function npcStatusLabel(npc: Npc): string {
  return STATUS_LABELS[npcStatus(npc)];
}

export function npcKindLabel(npc: Npc): string {
  return KIND_LABELS[npc.kind];
}

export function isNpcDead(npc: Npc): boolean {
  return npcStatus(npc) === "dead";
}

export function npcHasAppeared(npc: Npc): boolean {
  return (npc.snapshot?.appearedInSessionIds.length ?? 0) > 0;
}

export function npcSeenBy(npc: Npc, adventurerId: string): boolean {
  return npc.snapshot?.seenByAdventurerIds.includes(adventurerId) ?? false;
}
