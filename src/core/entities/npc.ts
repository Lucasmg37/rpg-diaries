import type { NpcSnapshot } from "./npc-event";

export type NpcKind = "npc" | "boss";

export type AtributoKey = "for" | "des" | "con" | "int" | "sab" | "car";

export interface NpcAttributes {
  for: number;
  des: number;
  con: number;
  int: number;
  sab: number;
  car: number;
}

/** Um componente de dano de um ataque — permite somar tipos distintos (ex.: 1d6 cortante + 1d6 ácido). */
export interface NpcDamagePart {
  dado: string;
  tipo?: string;
}

export interface NpcAttack {
  name: string;
  bonus?: string;
  damage?: NpcDamagePart[];
  critico?: string;
}

/** Perícia com o bônus já calculado e o atributo associado (estilo Tormenta: bônus = treino + atributo). */
export interface NpcSkill {
  nome: string;
  atributo?: AtributoKey;
  bonus: number;
}

/** Habilidade especial com o impacto/dano que ela causa (ex.: "Falha em Fortitude: 1d6 de dano e atordoado"). */
export interface NpcAbility {
  nome: string;
  efeito?: string;
}

/** Teste de resistência: o atributo testado, a CD e a consequência de cada resultado. */
export interface NpcSavingThrow {
  atributo?: AtributoKey;
  cd?: number;
  sucesso?: string;
  falha?: string;
}

/** Magia com tipo (escola), área de efeito e a forma de esquivar (teste de resistência). */
export interface NpcSpell {
  nome: string;
  tipo?: string;
  area?: string;
  resistencia?: NpcSavingThrow;
  efeito?: string;
}

/** Ficha resumida no estilo Tormenta — só o necessário pra consulta rápida na mesa. */
export interface NpcStats {
  classOrType: string;
  level?: number;
  pv: number;
  pm?: number;
  defesa: number;
  resistencias?: string[];
  imunidades?: string[];
  atributos?: NpcAttributes;
  ataques?: NpcAttack[];
  pericias?: NpcSkill[];
  habilidades?: NpcAbility[];
  magias?: NpcSpell[];
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
