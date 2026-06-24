import Link from "next/link";

import type { Adventurer } from "@/core/entities/adventurer";
import {
  adventurerClassLabel,
  adventurerLevel,
  adventurerStatusLabel,
  isAdventurerDead,
} from "@/lib/adventurer-view";

/** Card do elenco fixo da aventura — leva à página pública do aventureiro (identidade + linha do tempo). */
export function AdventurerCard({ adventurer }: { adventurer: Adventurer }) {
  const isDead = isAdventurerDead(adventurer);

  return (
    <Link
      href={`/adventurers/${adventurer.id}`}
      className={`panel flex flex-col gap-3 p-5 transition-colors hover:border-guild-goldsoft ${isDead ? "opacity-65" : ""}`}
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
            {adventurerClassLabel(adventurer)} · Nv. {adventurerLevel(adventurer)}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 font-heading text-[10px] uppercase tracking-wide ${
            isDead
              ? "bg-guild-danger/20 text-guild-red"
              : "bg-guild-green/15 text-guild-green"
          }`}
        >
          {adventurerStatusLabel(adventurer)}
        </span>
      </div>

      <p className="border-t border-guild-border pt-3 text-sm leading-relaxed text-guild-muted">
        {adventurer.background}
      </p>

      {adventurer.goal ? (
        <p className="text-xs italic leading-relaxed text-guild-goldsoft">
          🎯 {adventurer.goal}
        </p>
      ) : null}

      <span className="mt-auto font-heading text-[11px] uppercase tracking-wide text-guild-goldsoft transition-colors group-hover:text-guild-gold">
        Ver linha do tempo →
      </span>
    </Link>
  );
}
