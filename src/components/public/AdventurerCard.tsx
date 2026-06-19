import type { Adventurer } from "@/core/entities/adventurer";

/** Card do elenco fixo da aventura (atributos permanentes do aventureiro). */
export function AdventurerCard({ adventurer }: { adventurer: Adventurer }) {
  const isDead = adventurer.status.toLowerCase() === "morto";

  return (
    <div
      className={`panel flex flex-col gap-3 p-5 ${isDead ? "opacity-65" : ""}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl" aria-hidden>
          {adventurer.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading font-semibold text-guild-gold">
            {adventurer.name}
          </p>
          <p className="truncate text-xs uppercase tracking-wide text-guild-muted">
            {adventurer.className} · Nv. {adventurer.level}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 font-heading text-[10px] uppercase tracking-wide ${
            isDead
              ? "bg-guild-danger/20 text-guild-red"
              : "bg-guild-green/15 text-guild-green"
          }`}
        >
          {adventurer.status}
        </span>
      </div>

      <p className="border-t border-guild-border pt-3 text-sm leading-relaxed text-guild-muted">
        {adventurer.background}
      </p>

      {adventurer.sheetUrl ? (
        <a
          href={adventurer.sheetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto font-heading text-[11px] uppercase tracking-wide text-guild-goldsoft transition-colors hover:text-guild-gold"
        >
          Ver ficha completa →
        </a>
      ) : null}
    </div>
  );
}
