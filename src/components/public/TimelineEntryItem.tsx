import type { TimelineEntry } from "@/core/entities/session";
import { Callout } from "../ui/Callout";

/** Um nó da linha do tempo da sessão, com callout opcional. */
export function TimelineEntryItem({
  entry,
  isLast,
}: {
  entry: TimelineEntry;
  isLast: boolean;
}) {
  return (
    <li className="relative flex gap-5 pb-6 last:pb-0">
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
        {entry.icon}
      </span>

      <div className="flex-1 pt-1">
        <h4 className="font-heading text-sm font-semibold text-guild-gold">
          {entry.title}
        </h4>
        <p className="mt-1 leading-relaxed text-guild-muted">{entry.body}</p>
        {entry.callout ? <Callout className="mt-3">{entry.callout}</Callout> : null}
      </div>
    </li>
  );
}
