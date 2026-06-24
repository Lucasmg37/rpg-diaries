import type {
  CreateAdventurerInput,
  UpdateAdventurerInput,
} from "@/core/entities/adventurer";
import type { CreateAdventurerEventInput } from "@/core/entities/adventurer-event";
import type {
  CreateLooseEndInput,
  UpdateLooseEndInput,
} from "@/core/entities/loose-end";
import type {
  CreateNpcInput,
  NpcAttack,
  NpcSavingThrow,
  NpcStats,
  UpdateNpcInput,
} from "@/core/entities/npc";
import type { CreateNpcEventInput } from "@/core/entities/npc-event";
import type {
  CreateSessionInput,
  UpdateSessionInput,
} from "@/core/entities/session";
import type {
  CreateStoryNoteInput,
  CreateStoryPlanInput,
  LoreBanner,
  Scene,
  UpdateStoryPlanInput,
} from "@/core/entities/story-plan";

/**
 * Builders que normalizam/coagem o corpo das requisições admin em inputs de
 * domínio. Ficam fora dos arquivos de rota porque o Next só aceita exports de
 * handlers HTTP (GET/POST/…) em route.ts.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

export function buildSessionInput(
  body: Record<string, any>,
  guildId: string,
): CreateSessionInput {
  return {
    guildId,
    adventureId: String(body.adventureId ?? ""),
    title: String(body.title ?? ""),
    number: Number(body.number ?? 0),
    icon: String(body.icon ?? ""),
    summary: String(body.summary ?? ""),
    timeline: Array.isArray(body.timeline) ? body.timeline : [],
    tags: Array.isArray(body.tags) ? body.tags : [],
    masterNotes: String(body.masterNotes ?? ""),
    participants: Array.isArray(body.participants) ? body.participants : [],
    looseEndIds: Array.isArray(body.looseEndIds) ? body.looseEndIds : [],
    npcIds: Array.isArray(body.npcIds) ? body.npcIds.map(String) : undefined,
    closing:
      body.closing && body.closing.quote
        ? {
            quote: String(body.closing.quote),
            tagline: String(body.closing.tagline ?? ""),
          }
        : undefined,
  };
}

/**
 * Patch PARCIAL de sessão: inclui apenas os campos presentes em `args`. Usado
 * pelo MCP `updateSession`, que pode atualizar só um campo (ex.: participantes)
 * sem zerar os demais.
 */
export function buildSessionPatch(
  args: Record<string, any>,
): UpdateSessionInput {
  const p: UpdateSessionInput = {};
  if ("title" in args) p.title = String(args.title);
  if ("number" in args) p.number = Number(args.number);
  if ("icon" in args) p.icon = String(args.icon);
  if ("summary" in args) p.summary = String(args.summary);
  if ("masterNotes" in args) p.masterNotes = String(args.masterNotes);
  if (Array.isArray(args.timeline)) p.timeline = args.timeline;
  if (Array.isArray(args.tags)) p.tags = args.tags;
  if (Array.isArray(args.participants)) p.participants = args.participants;
  if (Array.isArray(args.looseEndIds)) p.looseEndIds = args.looseEndIds;
  if (Array.isArray(args.npcIds)) p.npcIds = args.npcIds.map(String);
  if ("closing" in args) {
    p.closing =
      args.closing && args.closing.quote
        ? {
            quote: String(args.closing.quote),
            tagline: String(args.closing.tagline ?? ""),
          }
        : undefined;
  }
  return p;
}

/** Identidade do aventureiro a criar. `level`/`status` não existem mais no tipo — ver `initialLevelFromBody`. */
export function buildAdventurerInput(
  body: Record<string, any>,
  guildId: string,
): CreateAdventurerInput {
  return {
    guildId,
    adventureId: String(body.adventureId ?? ""),
    name: String(body.name ?? ""),
    className: String(body.className ?? ""),
    icon: String(body.icon ?? ""),
    background: String(body.background ?? ""),
    goal: body.goal ? String(body.goal) : undefined,
    sheetUrl: String(body.sheetUrl ?? ""),
  };
}

/** Nível de partida do evento `joined` gerado por `createAdventurer` (não é campo da entidade). */
export function initialLevelFromBody(body: Record<string, any>): number {
  return Number(body.level ?? 1);
}

/**
 * Patch de identidade do aventureiro. `level`/`status` não existem mais no
 * tipo — mudam só via `appendAdventurerEvent` (timeline).
 */
export function buildAdventurerPatch(
  args: Record<string, any>,
): UpdateAdventurerInput {
  const p: UpdateAdventurerInput = {};
  if ("name" in args) p.name = String(args.name);
  if ("className" in args) p.className = String(args.className);
  if ("icon" in args) p.icon = String(args.icon);
  if ("background" in args) p.background = String(args.background);
  if ("goal" in args) p.goal = args.goal ? String(args.goal) : undefined;
  if ("sheetUrl" in args) p.sheetUrl = String(args.sheetUrl);
  return p;
}

/**
 * Builder do evento de timeline. Os campos comuns são normalizados aqui; os
 * campos específicos de cada `type` (ex.: `className`/`toLevel` em `level_up`,
 * `item` em `item_gained`) chegam como estão no body — a validação fina de
 * payload por tipo fica a cargo de quem chama o MCP (mestre/automação),
 * análogo ao restante destes builders.
 */
export function buildAdventurerEventInput(
  body: Record<string, any>,
  guildId: string,
): CreateAdventurerEventInput {
  const { guildId: _g, adventureId, actorId, targetIds, ...rest } = body;
  return {
    ...rest,
    guildId,
    adventureId: String(adventureId ?? ""),
    actorId: String(actorId ?? ""),
    targetIds: Array.isArray(targetIds) ? targetIds.map(String) : undefined,
    sessionId: body.sessionId ?? null,
    visibility: body.visibility === "master" ? "master" : "player",
    occurredAt: String(body.occurredAt ?? new Date().toISOString()),
    title: String(body.title ?? ""),
  } as CreateAdventurerEventInput;
}

export function buildLooseEndInput(
  body: Record<string, any>,
  guildId: string,
): CreateLooseEndInput {
  return {
    guildId,
    adventureId: String(body.adventureId ?? ""),
    title: String(body.title ?? ""),
    category: String(body.category ?? ""),
    description: String(body.description ?? ""),
    color: String(body.color ?? "#a07a40"),
    icon: String(body.icon ?? ""),
    resolved: Boolean(body.resolved),
  };
}

/** Patch parcial de fio solto (ex.: só marcar `resolved`, sem reenviar o resto). */
export function buildLooseEndPatch(
  args: Record<string, any>,
): UpdateLooseEndInput {
  const p: UpdateLooseEndInput = {};
  if ("title" in args) p.title = String(args.title);
  if ("category" in args) p.category = String(args.category);
  if ("description" in args) p.description = String(args.description);
  if ("color" in args) p.color = String(args.color);
  if ("icon" in args) p.icon = String(args.icon);
  if ("resolved" in args) p.resolved = Boolean(args.resolved);
  return p;
}

/** Normaliza o banner de lore (ou undefined se vazio). */
function normalizeLoreBanner(raw: any): LoreBanner | undefined {
  if (!raw || (!raw.label && !raw.body)) return undefined;
  return {
    label: String(raw.label ?? ""),
    body: String(raw.body ?? ""),
    tags: Array.isArray(raw.tags) ? raw.tags.map((t: any) => String(t)) : [],
  };
}

/** Garante que cada cena tenha id (gera um a partir do índice se faltar). */
function normalizeScenes(raw: any): Scene[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((s: any, i: number) => ({
    id: s.id ? String(s.id) : `cena-${i + 1}`,
    icon: String(s.icon ?? ""),
    title: String(s.title ?? ""),
    meta: String(s.meta ?? ""),
    blocks: Array.isArray(s.blocks) ? s.blocks : [],
    npcIds: Array.isArray(s.npcIds) ? s.npcIds.map(String) : undefined,
  }));
}

export function buildStoryPlanInput(
  body: Record<string, any>,
  guildId: string,
): CreateStoryPlanInput {
  return {
    guildId,
    adventureId: String(body.adventureId ?? ""),
    title: String(body.title ?? ""),
    eyebrow: String(body.eyebrow ?? ""),
    subtitle: String(body.subtitle ?? ""),
    loreBanner: normalizeLoreBanner(body.loreBanner),
    scenes: normalizeScenes(body.scenes),
    reward: body.reward ? String(body.reward) : undefined,
    order: Number(body.order ?? 0),
  };
}

/** Patch PARCIAL de roteiro: inclui só os campos presentes em `args`. */
export function buildStoryPlanPatch(
  args: Record<string, any>,
): UpdateStoryPlanInput {
  const p: UpdateStoryPlanInput = {};
  if ("title" in args) p.title = String(args.title);
  if ("eyebrow" in args) p.eyebrow = String(args.eyebrow);
  if ("subtitle" in args) p.subtitle = String(args.subtitle);
  if ("order" in args) p.order = Number(args.order);
  if ("loreBanner" in args) p.loreBanner = normalizeLoreBanner(args.loreBanner);
  if ("scenes" in args) p.scenes = normalizeScenes(args.scenes);
  if ("reward" in args) p.reward = args.reward ? String(args.reward) : undefined;
  return p;
}

const ATRIBUTO_KEYS = ["for", "des", "con", "int", "sab", "car"] as const;

/** Aceita perícias no formato antigo (string[]) ou novo ({nome, atributo?, bonus}[]). */
function normalizeNpcSkills(raw: any): NpcStats["pericias"] {
  if (!Array.isArray(raw)) return undefined;
  const list = raw.map((p: any) => {
    if (typeof p === "string") return { nome: p, bonus: 0 };
    const atributo = ATRIBUTO_KEYS.includes(p.atributo) ? p.atributo : undefined;
    return {
      nome: String(p.nome ?? ""),
      atributo,
      bonus: Number(p.bonus ?? 0),
    };
  });
  return list.length ? list : undefined;
}

/** Aceita habilidades no formato antigo (string[]) ou novo ({nome, efeito?}[]). */
function normalizeNpcAbilities(raw: any): NpcStats["habilidades"] {
  if (!Array.isArray(raw)) return undefined;
  const list = raw.map((h: any) =>
    typeof h === "string"
      ? { nome: h }
      : { nome: String(h.nome ?? ""), efeito: h.efeito ? String(h.efeito) : undefined },
  );
  return list.length ? list : undefined;
}

/** Normaliza um teste de resistência ({atributo?, cd?, sucesso?, falha?}) ou undefined se vazio. */
function normalizeNpcSavingThrow(raw: any): NpcSavingThrow | undefined {
  if (!raw) return undefined;
  const atributo = ATRIBUTO_KEYS.includes(raw.atributo) ? raw.atributo : undefined;
  const cd = raw.cd !== undefined ? Number(raw.cd) : undefined;
  const sucesso = raw.sucesso ? String(raw.sucesso) : undefined;
  const falha = raw.falha ? String(raw.falha) : undefined;
  if (!atributo && cd === undefined && !sucesso && !falha) return undefined;
  return { atributo, cd, sucesso, falha };
}

/** Normaliza magias ({nome, tipo?, area?, resistencia?, efeito?}[]). */
function normalizeNpcSpells(raw: any): NpcStats["magias"] {
  if (!Array.isArray(raw)) return undefined;
  const list = raw.map((m: any) => ({
    nome: String(m.nome ?? ""),
    tipo: m.tipo ? String(m.tipo) : undefined,
    area: m.area ? String(m.area) : undefined,
    resistencia: normalizeNpcSavingThrow(m.resistencia),
    efeito: m.efeito ? String(m.efeito) : undefined,
  }));
  return list.length ? list : undefined;
}

/** Aceita dano de ataque no formato antigo (string livre) ou novo (lista de {dado, tipo?}). */
function normalizeNpcDamage(raw: any): NpcAttack["damage"] {
  if (!raw) return undefined;
  if (typeof raw === "string") return raw ? [{ dado: raw }] : undefined;
  if (!Array.isArray(raw)) return undefined;
  const list = raw.map((d: any) =>
    typeof d === "string"
      ? { dado: d }
      : { dado: String(d.dado ?? ""), tipo: d.tipo ? String(d.tipo) : undefined },
  );
  return list.length ? list : undefined;
}

/** Normaliza a ficha resumida (Tormenta) ou undefined se vazia. */
export function normalizeNpcStats(raw: any): NpcStats | undefined {
  if (!raw || raw.pv === undefined) return undefined;
  return {
    classOrType: String(raw.classOrType ?? ""),
    level: raw.level !== undefined ? Number(raw.level) : undefined,
    pv: Number(raw.pv ?? 0),
    pm: raw.pm !== undefined ? Number(raw.pm) : undefined,
    defesa: Number(raw.defesa ?? 0),
    resistencias: Array.isArray(raw.resistencias)
      ? raw.resistencias.map(String)
      : undefined,
    imunidades: Array.isArray(raw.imunidades)
      ? raw.imunidades.map(String)
      : undefined,
    atributos: raw.atributos
      ? {
          for: Number(raw.atributos.for ?? 0),
          des: Number(raw.atributos.des ?? 0),
          con: Number(raw.atributos.con ?? 0),
          int: Number(raw.atributos.int ?? 0),
          sab: Number(raw.atributos.sab ?? 0),
          car: Number(raw.atributos.car ?? 0),
        }
      : undefined,
    ataques: Array.isArray(raw.ataques)
      ? raw.ataques.map((a: any) => ({
          name: String(a.name ?? ""),
          bonus: a.bonus ? String(a.bonus) : undefined,
          damage: normalizeNpcDamage(a.damage),
          critico: a.critico ? String(a.critico) : undefined,
        }))
      : undefined,
    pericias: normalizeNpcSkills(raw.pericias),
    habilidades: normalizeNpcAbilities(raw.habilidades),
    magias: normalizeNpcSpells(raw.magias),
  };
}

export function buildNpcInput(
  body: Record<string, any>,
  guildId: string,
): CreateNpcInput {
  return {
    guildId,
    adventureId: String(body.adventureId ?? ""),
    arcId: body.arcId ? String(body.arcId) : undefined,
    kind: body.kind === "boss" ? "boss" : "npc",
    name: String(body.name ?? ""),
    icon: body.icon ? String(body.icon) : undefined,
    role: body.role ? String(body.role) : undefined,
    description: String(body.description ?? ""),
    masterNotes: body.masterNotes ? String(body.masterNotes) : undefined,
    stats: normalizeNpcStats(body.stats),
    sheetUrl: body.sheetUrl ? String(body.sheetUrl) : undefined,
  };
}

/** Patch parcial de identidade do NPC. */
export function buildNpcPatch(args: Record<string, any>): UpdateNpcInput {
  const p: UpdateNpcInput = {};
  if ("arcId" in args) p.arcId = args.arcId ? String(args.arcId) : undefined;
  if ("kind" in args) p.kind = args.kind === "boss" ? "boss" : "npc";
  if ("name" in args) p.name = String(args.name);
  if ("icon" in args) p.icon = args.icon ? String(args.icon) : undefined;
  if ("role" in args) p.role = args.role ? String(args.role) : undefined;
  if ("description" in args) p.description = String(args.description);
  if ("masterNotes" in args) {
    p.masterNotes = args.masterNotes ? String(args.masterNotes) : undefined;
  }
  if ("stats" in args) p.stats = normalizeNpcStats(args.stats);
  if ("sheetUrl" in args) {
    p.sheetUrl = args.sheetUrl ? String(args.sheetUrl) : undefined;
  }
  return p;
}

/**
 * Builder do evento de timeline do NPC. Mesma estratégia de
 * buildAdventurerEventInput: campos comuns normalizados aqui, campos
 * específicos por `type` (ex.: `to`/`item`/`seenByAdventurerIds`) chegam como
 * estão no body.
 */
export function buildNpcEventInput(
  body: Record<string, any>,
  guildId: string,
): CreateNpcEventInput {
  const { guildId: _g, adventureId, npcId, ...rest } = body;
  return {
    ...rest,
    guildId,
    adventureId: String(adventureId ?? ""),
    npcId: String(npcId ?? ""),
    sessionId: body.sessionId ?? null,
    visibility: body.visibility === "master" ? "master" : "player",
    occurredAt: String(body.occurredAt ?? new Date().toISOString()),
    title: String(body.title ?? ""),
  } as CreateNpcEventInput;
}

export function buildStoryNoteInput(
  body: Record<string, any>,
): CreateStoryNoteInput {
  return {
    body: String(body.body ?? ""),
    sceneId: body.sceneId ? String(body.sceneId) : undefined,
  };
}
