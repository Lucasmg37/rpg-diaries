import type { NpcEvent } from "@/core/entities/npc-event";

const TYPE_ICONS: Record<NpcEvent["type"], string> = {
  status_change: "🔁",
  appearance: "👁️",
  item_gained: "🎁",
  item_lost: "📤",
  relationship: "🤝",
  note: "📖",
};

/**
 * Linha do tempo pública de um NPC/Boss (mais recente primeiro). Os eventos
 * chegam já filtrados para `visibility: "player"` — nada sigiloso do mestre
 * aparece aqui.
 */
export function NpcTimeline({ events }: { events: NpcEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-guild-muted">Nenhum registro público ainda.</p>
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
            <h4 className="font-heading text-sm font-semibold text-guild-gold">
              {e.title}
            </h4>
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
