import type { AdventurerEvent } from "@/core/entities/adventurer-event";
import { Button, Callout, Pill } from "@/components/ui";
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

function AdventurerTimelineNode({
  event,
  isLast,
  adventurerNamesById,
  onRetcon,
}: {
  event: AdventurerEvent;
  isLast: boolean;
  adventurerNamesById: Map<string, string>;
  onRetcon?: (event: AdventurerEvent) => void;
}) {
  return (
    <li className={`relative flex gap-5 pb-6 last:pb-0 ${event.retconnedBy ? "opacity-50" : ""}`}>
      {/* Linha vertical conectando os nós */}
      {!isLast ? (
        <span
          className="absolute left-[18px] top-10 bottom-0 w-px bg-guild-border"
          aria-hidden
        />
      ) : null}

      {/* Nó / ícone */}
      <span
        className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-guild-border bg-guild-border/30 text-sm"
        aria-hidden
      >
        {TYPE_ICONS[event.type]}
      </span>

      <div className="flex-1 space-y-1 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-heading text-sm font-semibold text-guild-gold">
            {event.title}
          </h4>
          <Pill color={colors.muted} className="text-[9px]">
            {event.type}
          </Pill>
          {event.visibility === "master" ? (
            <Pill color={colors.red} icon="🔒" className="text-[9px]">
              Mestre
            </Pill>
          ) : null}
          {event.retconnedBy ? (
            <Pill color={colors.muted} className="text-[9px]">
              Corrigido
            </Pill>
          ) : event.retcons ? (
            <Pill color={colors.goldsoft} className="text-[9px]">
              Correção
            </Pill>
          ) : null}
        </div>
        <p className="text-[11px] text-guild-muted">
          {new Date(event.occurredAt).toLocaleDateString("pt-BR")}
          {event.targetIds?.length
            ? ` · com ${event.targetIds.map((id) => adventurerNamesById.get(id) ?? id).join(", ")}`
            : ""}
        </p>
        {event.body ? (
          <p className="leading-relaxed text-guild-muted">{event.body}</p>
        ) : null}
        {event.visibility === "master" ? (
          <Callout tone="red" className="mt-2 text-xs">
            Nota do mestre — não aparece na página pública.
          </Callout>
        ) : null}
        {onRetcon && !event.retconnedBy ? (
          <Button
            type="button"
            variant="ghost"
            className="!text-[10px]"
            onClick={() => onRetcon(event)}
          >
            Corrigir
          </Button>
        ) : null}
      </div>
    </li>
  );
}

/** Linha do tempo de eventos de um aventureiro (mais recente primeiro), no estilo de nós conectados das sessões. Inclui eventos `master` — uso exclusivo da área logada. */
export function AdventurerTimeline({
  events,
  adventurerNamesById,
  onRetcon,
}: {
  events: AdventurerEvent[];
  adventurerNamesById: Map<string, string>;
  onRetcon?: (event: AdventurerEvent) => void;
}) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-guild-muted">
        Nenhum evento registrado ainda.
      </p>
    );
  }

  const ordered = [...events].sort((a, b) =>
    b.occurredAt.localeCompare(a.occurredAt),
  );

  return (
    <ul className="panel p-6">
      {ordered.map((e, i) => (
        <AdventurerTimelineNode
          key={e.id}
          event={e}
          isLast={i === ordered.length - 1}
          adventurerNamesById={adventurerNamesById}
          onRetcon={onRetcon}
        />
      ))}
    </ul>
  );
}
