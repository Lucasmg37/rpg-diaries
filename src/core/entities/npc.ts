import type { NpcSnapshot } from "./npc-event";

export type NpcKind = "npc" | "boss";

export interface NpcAttributes {
  for: number;
  des: number;
  con: number;
  int: number;
  sab: number;
  car: number;
}

export interface NpcAttack {
  name: string;
  bonus?: string;
  damage?: string;
}

/** Ficha resumida no estilo Tormenta — só o necessário pra consulta rápida na mesa. */
export interface NpcStats {
  classOrType: string;
  level?: number;
  pv: number;
  pm?: number;
  defesa: number;
  resistencias?: string[];
  atributos?: NpcAttributes;
  ataques?: NpcAttack[];
  pericias?: string[];
  habilidades?: string[];
}

/**
 * NPC ou Boss — entidade única por Adventure, com relação opcional a um arco.
 * `description` é sempre pública (lore/persona); `masterNotes` nunca é
 * exposta fora da área logada/MCP autenticado (mesmo padrão de
 * `Session.masterNotes`). `snapshot` é derivado da timeline de NpcEvent
 * (core/usecases/project-npc-snapshot.ts), nunca editado à mão.
 */
export interface Npc {
  id: string;
  guildId: string;
  adventureId: string;
  arcId?: string;
  kind: NpcKind;
  name: string;
  icon?: string;
  role?: string;
  description: string;
  masterNotes?: string;
  stats?: NpcStats;
  sheetUrl?: string;
  snapshot?: NpcSnapshot;
}

export type CreateNpcInput = Omit<Npc, "id" | "snapshot">;

export type UpdateNpcInput = Partial<
  Omit<Npc, "id" | "guildId" | "adventureId" | "snapshot">
>;

/** Patch de baixo nível usado pelo repositório — inclui `snapshot`. */
export type NpcRepositoryPatch = Partial<Omit<Npc, "id" | "guildId" | "adventureId">>;
