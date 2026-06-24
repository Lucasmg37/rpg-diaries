import Link from "next/link";

import type { Npc } from "@/core/entities/npc";
import { isNpcDead, npcKindLabel, npcStatusLabel } from "@/lib/npc-view";

/** Card de NPC/Boss já apresentado na crônica — leva à ficha pública (descrição + linha do tempo). */
export function NpcCard({ npc }: { npc: Npc }) {
  const isDead = isNpcDead(npc);

  return (
    <Link
      href={`/npcs/${npc.id}`}
      className={`panel flex flex-col gap-3 p-5 transition-colors hover:border-guild-goldsoft ${isDead ? "opacity-65" : ""}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl" aria-hidden>
          {npc.icon ?? (npc.kind === "boss" ? "👹" : "🧙")}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading font-semibold text-guild-gold">
            {npc.name}
          </p>
          <p className="truncate text-xs uppercase tracking-wide text-guild-muted">
            {npcKindLabel(npc)}
            {npc.role ? ` · ${npc.role}` : ""}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 font-heading text-[10px] uppercase tracking-wide ${
            isDead
              ? "bg-guild-danger/20 text-guild-red"
              : "bg-guild-green/15 text-guild-green"
          }`}
        >
          {npcStatusLabel(npc)}
        </span>
      </div>

      <p className="border-t border-guild-border pt-3 text-sm leading-relaxed text-guild-muted">
        {npc.description}
      </p>

      <span className="mt-auto font-heading text-[11px] uppercase tracking-wide text-guild-goldsoft transition-colors group-hover:text-guild-gold">
        Ver ficha →
      </span>
    </Link>
  );
}
