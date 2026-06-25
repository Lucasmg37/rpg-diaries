/** StatCard — caixa com borda para destacar um valor + rótulo (ficha de combate, ícone opcional). */
export function StatCard({
  icon,
  label,
  value,
}: {
  icon?: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-guild-border bg-guild-border/10 p-2 text-center">
      <p className="font-heading text-lg font-bold leading-tight text-guild-gold">
        {icon ? <span aria-hidden>{icon} </span> : null}
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wide text-guild-muted">{label}</p>
    </div>
  );
}
