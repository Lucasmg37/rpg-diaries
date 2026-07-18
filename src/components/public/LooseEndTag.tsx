"use client";

import { useState } from "react";

import type { LooseEnd } from "@/core/entities/loose-end";
import { Modal } from "../ui/Modal";
import { Pill } from "../ui/Pill";

/** Pílula compacta de fio solto — abre os detalhes em modal ao clicar. */
export function LooseEndTag({ looseEnd }: { looseEnd: LooseEnd }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="transition-opacity hover:opacity-80"
      >
        <Pill color={looseEnd.color} icon={looseEnd.icon}>
          {looseEnd.title}
        </Pill>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} maxWidth="max-w-md">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden>
              {looseEnd.icon}
            </span>
            <h2 className="font-heading text-lg font-bold text-guild-gold">
              {looseEnd.title}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Pill color={looseEnd.color}>{looseEnd.category}</Pill>
            {looseEnd.resolved ? (
              <span className="rounded-full bg-guild-green/20 px-2 py-0.5 font-heading text-[10px] uppercase tracking-wide text-guild-green">
                ✓ Resolvido
              </span>
            ) : (
              <span className="rounded-full bg-guild-goldsoft/20 px-2 py-0.5 font-heading text-[10px] uppercase tracking-wide text-guild-goldsoft">
                Em aberto
              </span>
            )}
          </div>

          <p className="border-t border-guild-border pt-3 text-sm leading-relaxed text-guild-muted">
            {looseEnd.description}
          </p>
        </div>
      </Modal>
    </>
  );
}
