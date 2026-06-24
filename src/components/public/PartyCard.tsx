import Link from "next/link";

import type { ParticipantState } from "@/core/entities/session-participant";
import type { ResolvedParticipant } from "@/core/entities/views";
import { adventurerClassLabel, adventurerLevel } from "@/lib/adventurer-view";

/** Estilos de borda/fundo por estado visual da sessão (do HTML de referência). */
const STATE_STYLES: Record<ParticipantState, string> = {
  normal: "border-guild-border bg-guild-bg2/60",
  suspicious: "border-guild-danger bg-guild-danger/15",
  fallen: "border-guild-border bg-guild-bg2/60 opacity-60",
  new: "border-guild-green bg-guild-green/10",
};

/**
 * Card de um membro do grupo dentro de uma sessão. Recebe o Adventurer já
 * resolvido (nome, classe, ícone) + o `sessionBadge`/`sessionState`/`sessionNote`
 * contextuais daquela sessão específica.
 */
export function PartyCard({
  participant,
}: {
  participant: ResolvedParticipant;
}) {
  const { adventurer, sessionBadge, sessionState, sessionNote } = participant;
  const stateClass = STATE_STYLES[sessionState ?? "normal"];

  return (
    <Link
      href={`/adventurers/${adventurer.id}`}
      className={`flex flex-col items-center rounded-md border p-4 text-center transition-colors hover:border-guild-goldsoft ${stateClass}`}
    >
      <span className="text-2xl" aria-hidden>
        {adventurer.icon}
      </span>
      <span className="mt-2 font-heading text-sm font-semibold text-guild-gold">
        {adventurer.name}
      </span>
      <span className="mt-1 text-[11px] text-guild-muted">
        {adventurerClassLabel(adventurer)} · Nv. {adventurerLevel(adventurer)}
      </span>

      <span className="mt-2 inline-block rounded-full bg-guild-border/30 px-2 py-0.5 font-heading text-[9px] tracking-wide text-guild-goldsoft">
        {sessionBadge}
      </span>

      {sessionNote ? (
        <p className="mt-2 text-[11px] italic leading-snug text-guild-muted">
          {sessionNote}
        </p>
      ) : null}
    </Link>
  );
}
