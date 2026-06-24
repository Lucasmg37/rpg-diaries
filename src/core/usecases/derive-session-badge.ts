import type { AdventurerEvent } from "@/core/entities/adventurer-event";
import type { ParticipantState } from "@/core/entities/session-participant";

export interface DerivedSessionBadge {
  badge: string;
  state?: ParticipantState;
}

/**
 * Projeta o badge/estado contextual de UM aventureiro em UMA sessão a partir
 * dos eventos que ele é dono (`actorId`) naquela sessão. É a versão "Fase 3"
 * do `sessionBadge`/`sessionState` — hoje texto livre digitado à mão em
 * `SessionParticipant`, aqui derivado da timeline para não duplicar a fonte
 * da verdade (ver §8/§9.2 do plano de event sourcing).
 *
 * Retorna `null` quando não há nenhum evento dessa sessão para esse
 * aventureiro — quem chama deve cair de volta no `sessionBadge` armazenado.
 */
export function deriveSessionBadge(
  events: AdventurerEvent[],
): DerivedSessionBadge | null {
  if (events.length === 0) return null;

  const ordered = [...events]
    .filter((e) => !e.retconnedBy)
    .sort((a, b) =>
      a.occurredAt === b.occurredAt
        ? (a.sequence ?? 0) - (b.sequence ?? 0)
        : a.occurredAt.localeCompare(b.occurredAt),
    );

  const parts: string[] = [];
  let state: ParticipantState | undefined;

  for (const e of ordered) {
    switch (e.type) {
      case "joined":
        parts.push("Novo membro");
        state = state ?? "new";
        break;
      case "level_up":
        parts.push(`↑ Nv. ${e.toLevel}`);
        break;
      case "death":
        parts.push("✝ Caído");
        state = "fallen";
        break;
      case "revival":
        parts.push("✦ Revivido");
        state = "normal";
        break;
      case "title_badge":
        if (e.granted) parts.push(e.title);
        break;
      case "state_flag":
        state = e.to;
        if (e.title) parts.push(e.title);
        break;
      default:
        // injury / relationship / item_* / sheet_revision / story_beat / status_change:
        // aparecem na timeline do aventureiro, mas não no badge curto da sessão.
        break;
    }
  }

  if (parts.length === 0 && !state) return null;
  return { badge: parts.join(" · "), state };
}
