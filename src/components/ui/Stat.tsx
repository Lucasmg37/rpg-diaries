/** Stat — número de destaque + rótulo (usado no bloco de estatísticas). */
export function Stat({
  value,
  label,
  accent = false,
}: {
  value: number | string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="text-center">
      <div
        className={`text-2xl font-semibold ${
          accent ? "text-guild-goldsoft" : "text-guild-gold"
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-[11px] uppercase tracking-wide text-guild-muted">
        {label}
      </div>
    </div>
  );
}
