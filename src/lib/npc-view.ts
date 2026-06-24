import type {
  Npc,
  NpcAttack,
  NpcKind,
  NpcSavingThrow,
  NpcSkill,
} from "@/core/entities/npc";
import type { NpcStatus } from "@/core/entities/npc-event";

const ATRIBUTO_LABELS: Record<string, string> = {
  for: "For",
  des: "Des",
  con: "Con",
  int: "Int",
  sab: "Sab",
  car: "Car",
};

/** Ex.: "Furtividade +5 (Des)" — bônus já calculado, atributo só como referência. */
export function formatNpcSkill(skill: NpcSkill): string {
  const bonusText = skill.bonus >= 0 ? `+${skill.bonus}` : String(skill.bonus);
  const atributoText = skill.atributo ? ` (${ATRIBUTO_LABELS[skill.atributo]})` : "";
  return `${skill.nome} ${bonusText}${atributoText}`;
}

/** Ex.: "1d6 cortante + 1d6 ácido" — soma componentes de dano de tipos distintos. */
export function formatNpcDamage(damage: NpcAttack["damage"]): string {
  if (!damage?.length) return "";
  return damage.map((d) => (d.tipo ? `${d.dado} ${d.tipo}` : d.dado)).join(" + ");
}

/** Ex.: "Fortitude (CD 16)" — a forma de esquivar de uma magia/habilidade. */
export function formatNpcSavingThrow(resistencia: NpcSavingThrow | undefined): string {
  if (!resistencia) return "";
  const atributoText = resistencia.atributo ? ATRIBUTO_LABELS[resistencia.atributo] : "";
  const cdText = resistencia.cd !== undefined ? ` (CD ${resistencia.cd})` : "";
  return `${atributoText}${cdText}`.trim();
}

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
