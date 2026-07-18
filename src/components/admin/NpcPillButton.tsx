"use client";

import { useState } from "react";

import { NpcDetailModal } from "@/components/public/NpcDetailModal";
import { Pill } from "@/components/ui/Pill";
import type { Npc } from "@/core/entities/npc";
import { npcKindLabel, npcStatusLabel } from "@/lib/npc-view";

/** Pílula de NPC/Boss de uma cena do roteiro — abre a ficha completa em modal. */
export function NpcPillButton({ npc, color }: { npc: Npc; color: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="transition-opacity hover:opacity-80"
      >
        <Pill
          color={color}
          icon={npc.icon ?? (npc.kind === "boss" ? "👹" : "🧙")}
        >
          {npc.name} · {npcKindLabel(npc)} · {npcStatusLabel(npc)}
        </Pill>
      </button>

      <NpcDetailModal npc={npc} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
