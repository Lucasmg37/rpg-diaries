/**
 * Quote — nota de encerramento: citação em itálico + linha final em maiúsculas.
 * Usada no rodapé das páginas de sessão.
 */
export function Quote({
  quote,
  tagline,
}: {
  quote: string;
  tagline?: string;
}) {
  return (
    <div className="text-center">
      <p className="mx-auto max-w-2xl text-lg italic leading-relaxed text-guild-muted">
        “{quote}”
      </p>
      {tagline ? (
        <p className="mt-4 font-heading text-[11px] uppercase tracking-[2px] text-guild-border">
          {tagline}
        </p>
      ) : null}
    </div>
  );
}
