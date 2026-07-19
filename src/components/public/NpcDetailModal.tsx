"use client";

import { Modal } from "@/components/ui/Modal";
import type { Npc } from "@/core/entities/npc";

import { NpcSheetContent } from "./NpcSheetContent";

/** Modal com a ficha completa de um NPC/Boss, aberto a partir de um badge. */
export function NpcDetailModal({
  npc,
  open,
  onClose,
  showInventory = false,
}: {
  npc: Npc;
  open: boolean;
  onClose: () => void;
  /** Mostra os itens do inventário (snapshot) — só em telas de mestre/admin. */
  showInventory?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-2xl">
      <NpcSheetContent npc={npc} panelled={false} showInventory={showInventory} />
    </Modal>
  );
}
