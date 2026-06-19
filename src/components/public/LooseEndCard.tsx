import type { LooseEnd } from "@/core/entities/loose-end";

/** Card de um fio solto / gancho narrativo (estilo do HTML de referência). */
export function LooseEndCard({ looseEnd }: { looseEnd: LooseEnd }) {
  return (
    <div
      className="rounded-md border p-4"
      style={{
        color: looseEnd.color,
        borderColor: `${looseEnd.color}59`,
        backgroundColor: `${looseEnd.color}1a`,
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base" aria-hidden>
            {looseEnd.icon}
          </span>
          <span className="font-heading text-xs uppercase tracking-wide">
            {looseEnd.title}
          </span>
        </div>
        {looseEnd.resolved ? (
          <span className="shrink-0 rounded-full bg-guild-green/20 px-2 py-0.5 font-heading text-[9px] uppercase tracking-wide text-guild-green">
            ✓ Resolvido
          </span>
        ) : null}
      </div>
      <p className="text-[13px] leading-relaxed text-guild-muted">
        {looseEnd.description}
      </p>
    </div>
  );
}
