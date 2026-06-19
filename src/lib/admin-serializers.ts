import type { CreateAdventurerInput } from "@/core/entities/adventurer";
import type { CreateLooseEndInput } from "@/core/entities/loose-end";
import type {
  CreateSessionInput,
  UpdateSessionInput,
} from "@/core/entities/session";

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
    level: Number(body.level ?? 1),
    background: String(body.background ?? ""),
    status: String(body.status ?? "Ativo"),
    sheetUrl: String(body.sheetUrl ?? ""),
  };
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
