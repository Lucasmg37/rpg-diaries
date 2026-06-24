import type { AdventurerEvent } from "@/core/entities/adventurer-event";
import { Pill } from "@/components/ui";
import { colors } from "@/components/ui/tokens";

const TYPE_ICONS: Record<AdventurerEvent["type"], string> = {
  joined: "🚪",
  level_up: "⬆️",
  status_change: "🔁",
  state_flag: "🚩",
  item_gained: "🎁",
  item_lost: "📤",
  relationship: "🤝",
  injury: "🩸",
  death: "✝️",
  revival: "✨",
  title_badge: "🏅",
  sheet_revision: "📄",
  story_beat: "📖",
};

/**
 * Linha do tempo pública de um aventureiro (mais recente primeiro), no mesmo
 * estilo de nós conectados das sessões. Os eventos chegam já filtrados para
 * `visibility: "player"` — nada sigiloso do mestre aparece aqui.
 */
export function AdventurerTimeline({
  events,
  adventurerNamesById,
}: {
  events: AdventurerEvent[];
  adventurerNamesById: Map<string, string>;
}) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-guild-muted">
        Nenhum registro público ainda.
      </p>
    );
  }

  const ordered = [...events].sort((a, b) =>
    b.occurredAt.localeCompare(a.occurredAt),
  );

  return (
    <ol className="panel list-none p-6">
      {ordered.map((e, i) => (
        <li key={e.id} className="relative flex gap-5 pb-6 last:pb-0">
          {i !== ordered.length - 1 ? (
            <span
              className="absolute left-[18px] top-10 bottom-0 w-px bg-guild-border"
              aria-hidden
            />
          ) : null}

          <span
            className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-guild-border bg-guild-border/30 text-sm"
            aria-hidden
          >
            {TYPE_ICONS[e.type]}
          </span>

          <div className="flex-1 space-y-1 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-heading text-sm font-semibold text-guild-gold">
                {e.title}
              </h4>
              {e.targetIds?.length ? (
                <Pill color={colors.muted} className="text-[9px]">
                  com {e.targetIds.map((id) => adventurerNamesById.get(id) ?? id).join(", ")}
                </Pill>
              ) : null}
            </div>
            <p className="text-[11px] text-guild-muted">
              {new Date(e.occurredAt).toLocaleDateString("pt-BR")}
            </p>
            {e.body ? (
              <p className="leading-relaxed text-guild-muted">{e.body}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
